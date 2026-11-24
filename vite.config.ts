import {defineConfig} from "vite"

export default defineConfig(({command}) => ({
  // Production builds are served from GitHub Pages at https://javarome.com/prosper/
  base: command === "build" ? "/prosper/" : "/"
}))
