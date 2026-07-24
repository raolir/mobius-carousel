import { createWriteStream } from 'node:fs'
import { access, mkdir, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ZipArchive } from 'archiver'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pluginSource = resolve(repositoryRoot, 'wordpress-plugin')
const outputDirectory = resolve(repositoryRoot, 'releases')
const outputPath = resolve(outputDirectory, 'mobius-carousel.zip')
const archiveRoot = 'mobius-carousel'

const requiredPaths = [
  resolve(pluginSource, 'mobius-carousel.php'),
  resolve(pluginSource, 'block'),
  resolve(pluginSource, 'includes'),
  resolve(pluginSource, 'dist'),
]

await Promise.all(requiredPaths.map((path) => access(path)))
await mkdir(outputDirectory, { recursive: true })
await rm(outputPath, { force: true })

await new Promise((resolveArchive, rejectArchive) => {
  const output = createWriteStream(outputPath)
  const archive = new ZipArchive({ zlib: { level: 9 } })

  output.on('close', resolveArchive)
  output.on('error', rejectArchive)
  archive.on('warning', rejectArchive)
  archive.on('error', rejectArchive)
  archive.pipe(output)

  archive.file(resolve(pluginSource, 'mobius-carousel.php'), {
    name: `${archiveRoot}/mobius-carousel.php`,
  })
  archive.directory(resolve(pluginSource, 'block'), `${archiveRoot}/block`)
  archive.directory(resolve(pluginSource, 'includes'), `${archiveRoot}/includes`)
  archive.directory(resolve(pluginSource, 'dist'), `${archiveRoot}/dist`)

  void archive.finalize()
})
