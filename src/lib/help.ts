import chalk from 'chalk';

/**
 * Displays detailed help information for the TreeCraft CLI
 * 
 * @returns Formatted help text for display
 */
export function getDetailedHelp(): string {
  const sections = [
    getHeader(),
    getUsage(),
    getCommands(),
    getVisualizationModes(),
    getExamples(),
    getFooter()
  ];

  return sections.join('\n\n');
}

/**
 * Generates the header section of help
 */
function getHeader(): string {
  return `${chalk.bold.green('TreeCraft')} - ${chalk.white('A powerful CLI for directory visualization, generation, and analysis')}
${chalk.gray('Version: 0.0.2')}`;
}

/**
 * Generates the usage section of help
 */
function getUsage(): string {
  return `${chalk.yellow('USAGE:')}
  ${chalk.cyan('treecraft')} ${chalk.gray('<command>')} ${chalk.gray('[options]')}`;
}

/**
 * Generates the commands section of help
 */
function getCommands(): string {
  return `${chalk.yellow('COMMANDS:')}
  ${chalk.cyan('viz')} ${chalk.gray('[path]')} ${chalk.gray('[options]')}       Visualize directory structure in various formats
  ${chalk.cyan('gen')} ${chalk.gray('<input>')} ${chalk.gray('-o <output>')}    Generate directory structure from specification
  ${chalk.cyan('stats')} ${chalk.gray('[path]')} ${chalk.gray('[options]')}     Analyze and display directory statistics
  ${chalk.cyan('search')} ${chalk.gray('[path]')} ${chalk.gray('<query>')}      Search for files by name
  ${chalk.cyan('help')}                           Display detailed help information`;
}

/**
 * Generates the visualization modes section of help
 */
function getVisualizationModes(): string {
  return `${chalk.yellow('VISUALIZATION MODES:')}
  ${chalk.cyan('tree')}        Traditional ASCII tree structure (default)
  ${chalk.cyan('graph')}       Hierarchical graph with weighted branches
  ${chalk.cyan('list')}        Flat list of all paths
  ${chalk.cyan('interactive')} Browse directory structure interactively`;
}

/**
 * Generates the examples section of help
 */
function getExamples(): string {
  return `${chalk.yellow('EXAMPLES:')}
  ${chalk.gray('# Visualize current directory as colored tree')}
  ${chalk.cyan('treecraft viz . -c')}

  ${chalk.gray('# Generate directory structure from specification')}
  ${chalk.cyan('treecraft gen spec.json -o ./project')}

  ${chalk.gray('# Show directory statistics with size distribution')}
  ${chalk.cyan('treecraft stats . -s -t')}

  ${chalk.gray('# Search for files matching a pattern')}
  ${chalk.cyan('treecraft search . config -t ".js"')}`;
}

/**
 * Generates the footer section of help
 */
function getFooter(): string {
  return `${chalk.gray('For more information and detailed documentation, visit:')}
  ${chalk.blue('https://github.com/TheAlphamerc/treecraft')}`;
} 