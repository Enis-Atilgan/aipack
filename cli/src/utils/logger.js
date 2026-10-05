import chalk from 'chalk';

export const log = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✓'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.error(chalk.red('✖'), msg),
  dim: (msg) => console.log(chalk.dim(msg)),
  heading: (msg) => console.log('\n' + chalk.bold.underline(msg)),
  item: (label, value) => console.log(`  ${chalk.dim(label + ':')} ${value}`),
};
