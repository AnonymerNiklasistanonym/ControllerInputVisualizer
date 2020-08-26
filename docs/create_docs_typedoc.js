const TypeDoc = require('typedoc')
const path = require('path')

const app = new TypeDoc.Application()

// If you want TypeDoc to load tsconfig.json / typedoc.json files
app.options.addReader(new TypeDoc.TSConfigReader())
app.options.addReader(new TypeDoc.TypeDocReader())

app.bootstrap({
    allowJs: true,
    ignoreCompilerErrors: true,
    mode: 'file',
    logger: 'error',
    target: 'ES2020',
    module: 'CommonJS',
    readme: path.join(__dirname, '..', 'README.md'),
    experimentalDecorators: true
})

const project = app.convert([
    path.join(__dirname, '..', 'main.js'),
    path.join(__dirname, '..', 'visualization_profiles.js')
])

if (project) { // Project may not have converted correctly
    const outputDir = path.join(__dirname, 'bin_html');

    // Rendered docs
    app.generateDocs(project, outputDir)
}
