{% slottedComponent 'Tabs.svelte', hydrate='eager', id="prereqs", tabs=['React', 'Vue', 'Svelte'] %}
{% renderTemplate "md" %}
<section>
You'll want React's suite of dependencies, along with the Slinkity React renderer:

```bash
npm i -D react react-dom @slinkity/renderer-react
```
</section>
<section>
You'll want to install Vue 3 + the Slinkity Vue renderer:

```bash
npm i -D vue@3 @slinkity/renderer-vue
```
</section>
<section>
You'll want to install Svelte + the Slinkity Svelte renderer:

```bash
npm i -D svelte @slinkity/renderer-svelte
```
</section>
{% endrenderTemplate %}
{% endslottedComponent %}