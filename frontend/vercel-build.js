// Vercel build script - sets environment variables to disable ESLint
process.env.DISABLE_ESLINT_PLUGIN = 'true';
process.env.CI = 'false';
process.env.GENERATE_SOURCEMAP = 'false';

console.log('Vercel build environment configured:');
console.log('- DISABLE_ESLINT_PLUGIN:', process.env.DISABLE_ESLINT_PLUGIN);
console.log('- CI:', process.env.CI);
console.log('- GENERATE_SOURCEMAP:', process.env.GENERATE_SOURCEMAP);

// Export the environment for use in build process
module.exports = {
  env: process.env
};
