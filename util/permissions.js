module.exports = {
  permissionsArray : [
    {Permission: 'manageProject', read: true, write: true, default_client: true, default_pm: true, default_dev: false,
    roads: []},
    {Permission: 'manageTeam', read: true, write: true,  default_client: true, default_pm: true, default_dev: false,
    roads: ['/Team/:Id']},
    {Permission: 'manageModules', read: true, write: true, default_client: true, default_pm: true, default_dev: false,
  roads:[]},
    {Permission: 'manageWallet', read: true, write: true, default_client: true, default_pm: false, default_dev: false,
  roads:[]},
    {Permission: 'manageCategory', read: true, write: true,  default_client: true, default_pm: true, default_dev: false,
  roads:[]},
    // configuration management permission
    {Permission: 'manageConfiguration', read: true, write: true,  default_client: true, default_pm: true, default_dev: false,
    roads: ['']},
    // permission management permissions
    {Permission: 'manageEa', read: true, write: true,  default_client: true, default_pm: false, default_dev: false,
    roads: []},
    {Permission: 'manageQa', read: true, write: true,  default_client: false, default_pm: false, default_dev: false, roads: []},
      {Permission: 'manageProjectManager', read: true, write: true,  default_client: false, default_pm: false, default_dev: false,
    roads: []},
    // file management permissions
    {Permission: 'manageFiles', read: true, write: true,  default_client: true, default_pm: true, default_dev: true,
    roads: ['/fileUpload/','/shareFile/:user/:file','/deleteFiles/:user/:file','/received/:user/:team','/files/:user/:team']},
  ],
}
