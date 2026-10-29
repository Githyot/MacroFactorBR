// App de desktop (Linux): abre a versão web do MacroFactorBR numa janela própria.
// Os arquivos são servidos pelo protocolo app://, que mantém a mesma origem entre
// aberturas; assim os dados salvos no aparelho (localStorage) não se perdem.

const { app, BrowserWindow, net, protocol, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');

const WEB_ROOT = path.join(__dirname, 'web');

protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

function resolveFile(url) {
  const { pathname } = new URL(url);
  const file = path.normalize(path.join(WEB_ROOT, decodeURIComponent(pathname)));
  // Rotas do app (/workout, /profile...) não são arquivos: devolvem o index.html.
  if (!file.startsWith(WEB_ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return path.join(WEB_ROOT, 'index.html');
  }
  return file;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 480,
    height: 900,
    minWidth: 360,
    title: 'MacroFactorBR',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'web', 'favicon.ico'),
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  // Links externos abrem no navegador do sistema.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.loadURL('app://macrofactorbr/');
}

app.whenReady().then(() => {
  protocol.handle('app', (request) => net.fetch(pathToFileURL(resolveFile(request.url)).toString()));
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
