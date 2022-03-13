const path = require('path')
const toFormattedDataForProps = require('../utils/toFormattedDataForProps')
const { toSSRComment } = require('../utils/consts')
const { log } = require('../utils/logger')

/**
 * @typedef AddComponentPagesParams
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../@types').PluginConfigGlobals} configGlobals
 * @property {any} eleventyConfig
 * @property {import('../@types').Renderer} renderer
 * @param {AddComponentPagesParams}
 */
module.exports = async function addComponentPages({
  renderer,
  eleventyConfig,
  componentAttrStore,
  configGlobals,
}) {
  if (!renderer.page) return

  const { useFormatted11tyData = true, getData } = await renderer.page({
    toCommonJSModule(...args) {
      return configGlobals.viteSSR.toCommonJSModule(...args)
    },
  })

  for (const extension of renderer.extensions) {
    console.log({ extension })
    eleventyConfig.addExtension(extension, {
      read: false,
      async getData(inputPath) {
        console.log({ inputPath, please: true })
        const absInputPath = path.join(configGlobals.resolvedAliases.root, inputPath)
        return await getData(absInputPath)
      },
      compileOptions: {
        permalink() {
          const __functions = this
          return function render({ permalink, ...data }) {
            if (typeof permalink === 'function') {
              return permalink({ ...data, __functions })
            } else {
              return permalink
            }
          }
        },
      },
      compile(_, inputPath) {
        const unboundFunctions = this.config?.javascriptFunctions ?? {}
        return async function render(data) {
          // functions should have access to "page" via the "this" keyword
          // this is missing on javascriptFunctions from this scope,
          // so we'll add that binding back on
          const __functions = Object.fromEntries(
            Object.entries(unboundFunctions).map(([name, fn]) => [
              name,
              fn.bind({ page: data.page }),
            ]),
          )
          const absInputPath = path.join(configGlobals.resolvedAliases.root, inputPath)
          let props

          /** @type {{ hydrate: import('../@types').Hydrate }} */
          const { hydrate = 'none' } = data
          if (typeof hydrate !== 'string' && typeof hydrate.props === 'function') {
            // if there's a "props" function,
            // use that to determine the component props
            const formattedData = useFormatted11tyData ? toFormattedDataForProps(data) : data
            const formattedDataWithFns = { ...formattedData, __functions }
            props = (await hydrate.props(formattedDataWithFns)) ?? {}
          } else if (hydrate === 'none' || hydrate.mode === 'none') {
            // if there's no "props" function and we don't hydrate the page,
            // pass *all* 11ty data as props
            props = { ...data, __functions }
          } else {
            // if there's no "props" function, but we *do* hydrate the page,
            // don't pass any props
            props = {}
          }

          if (data.render !== undefined) {
            log({
              type: 'warning',
              message: `The "render" prop no longer affects hydration as of v0.6! If you intended to use "render" to hydrate "${inputPath}," try using "hydrate" instead. Also note that pages are no longer hydrated by default. See our docs for more: https://slinkity.dev/docs/component-pages-layouts`,
            })
          }

          const id = componentAttrStore.push({
            path: absInputPath,
            props,
            hydrate: hydrate.mode ? hydrate.mode : hydrate,
            pageOutputPath: data.page.outputPath,
            rendererName: renderer.name,
          })

          return toSSRComment(id)
        }
      },
    })
  }
}
