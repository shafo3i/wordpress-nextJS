module.exports = {
  hooks: {
    readPackage(pkg) {
      // Only Better Auth's unused test-utils export needs this optional peer.
      // Keep the project's own Vitest devDependency, without shipping it via auth.
      if (pkg.name === "better-auth" && pkg.version === "1.7.7") {
        delete pkg.peerDependencies?.vitest;
        delete pkg.peerDependenciesMeta?.vitest;
      }
      return pkg;
    },
  },
};
