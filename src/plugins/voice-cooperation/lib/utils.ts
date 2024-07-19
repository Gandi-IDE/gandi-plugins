function findUserByOid(oid: string, pluginContext: PluginContext) {
  const { teamworkManager } = pluginContext;
  const user = teamworkManager.teamMembers.find((user) => user.id === oid);
  return user;
}

export { findUserByOid };
