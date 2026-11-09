// typescript-eslint cannot use the native TypeScript 7 compiler API yet
// (https://github.com/typescript-eslint/typescript-eslint/issues/10940).
// Until it can, the lint toolchain gets its own TypeScript 6; the project
// itself is still type-checked and built with TypeScript 7.
const NEEDS_TS6 = /^(typescript-eslint|@typescript-eslint\/.+|ts-api-utils)$/;

module.exports = {
  hooks: {
    readPackage(pkg) {
      if (NEEDS_TS6.test(pkg.name)) {
        delete pkg.peerDependencies?.typescript;
        delete pkg.peerDependenciesMeta?.typescript;
        pkg.dependencies = { ...pkg.dependencies, typescript: "npm:typescript@6.0.3" };
      }
      return pkg;
    },
  },
};
