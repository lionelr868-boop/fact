const { spawn } = require('child_process');

const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000'], {
  cwd: '/home/z/my-project',
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true
});

const logFile = require('fs').openSync('/home/z/my-project/dev.log', 'w');
child.stdout.pipe(require('fs').createWriteStream('/home/z/my-project/dev.log', { fd: logFile }));
child.stderr.pipe(require('fs').createWriteStream('/home/z/my-project/dev-err.log'));

child.on('exit', (code, signal) => {
  require('fs').writeFileSync('/home/z/my-project/server-exit.log', `Server exited with code: ${code}, signal: ${signal}, time: ${new Date().toISOString()}\n`);
});

child.unref();
console.log('Launcher exiting, child PID:', child.pid);
