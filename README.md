# dokka-html-mdx-transform

- Action to transform the output of dokkaHtml to a mdx format, typically used in combination  with Docusaurus.
- Typically, you should use `dest` as a path to your docs folder, and `folder` as name for the folder that should be generated within the docs folder (`folder` is added to all the ids).
- This also generates a JSON which can be imported for the sidebar.
- This is compatible with Dokka 1.7.20 (newer versions will likely work to some extent)
- This require the [@graphglue/dokka-docusaurus](https://www.npmjs.com/package/@graphglue/dokka-docusaurus) npm module
- This requires that `.source` files are handled by webpack as `asset/source`

## Inputs

## `src`

**Required** The path of the packages output of dokkaHTML, typically something like build/dokka/html

## `modules`

**Required** The modules in `src` which should be added to the documentation

## `dest`

**Required** The path where to copy the generated files

## `folder`

**Required** Name of the folder in dest which is created to store the output

## Example usage

```yml
uses: asheehiyan/dokka-html-mdx-transform@0.0.50
with:
  src: "build/dokka/html/my-android-library"
  platform: "android"
  modules: |
    module1
    module2
  dest: "website/android-docs"
  folder: "dokka"
  output_path_prefix: your/output/path/subdir
  displayed_sidebar: sidebarName

uses: asheehiyan/dokka-html-mdx-transform@0.0.50
  with:
    src: "build/jazzy/html/my-ios-library"
    platform: "ios"
    modules: |
      Classes
      Enums
      Extensions
      Protocols
      Structs
    dest: "website/ios-docs"
    folder: "jazzy"
    output_path_prefix: your/output/path/subdir
    displayed_sidebar: sidebarName
    remove_jazzy_footer: true
```
