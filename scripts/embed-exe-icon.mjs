import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as ResEdit from 'resedit'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const { version } = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const exePath = path.join(root, 'release', `Timeline4Things-${version}-portable.exe`)
const iconPath = path.join(root, 'build', 'icon.ico')

if (!fs.existsSync(exePath)) {
  console.error(`Portable exe not found: ${exePath}`)
  process.exit(1)
}
if (!fs.existsSync(iconPath)) {
  console.error(`Icon not found: ${iconPath}`)
  process.exit(1)
}

const exe = ResEdit.NtExecutable.from(fs.readFileSync(exePath))
const res = ResEdit.NtExecutableResource.from(exe)
const iconFile = ResEdit.Data.IconFile.from(fs.readFileSync(iconPath))
const iconGroups = ResEdit.Resource.IconGroupEntry.fromEntries(res.entries)
const iconGroupId = iconGroups[0]?.id ?? 1

ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
  res.entries,
  iconGroupId,
  1033,
  iconFile.icons.map((item) => item.data),
)

res.outputResource(exe)
fs.writeFileSync(exePath, Buffer.from(exe.generate()))
console.log(`Embedded icon into ${exePath} (icon group ${iconGroupId})`)
