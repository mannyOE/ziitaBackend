module.exports = {
  permissionsArray : [
    {Permission: 'manageProject', default_client: true, default_pm: true, default_dev: false},
    {Permission: 'manageTeam', default_client: true, default_pm: true, default_dev: false,roads: ['/Team/:Id']},
    {Permission: 'manageModules', default_client: true, default_pm: true, default_dev: false},
    {Permission: 'manageWallet', default_client: true, default_pm: false, default_dev: false},
    {Permission: 'manageCategory', default_client: true, default_pm: true, default_dev: false},
    // configuration management permission
    {Permission: 'manageConfiguration', default_client: true, default_pm: true, default_dev: false,
    roads: ['']},
    // permission management permissions
    {Permission: 'managePermission', default_client: true, default_pm: false, default_dev: false,
    roads: ['/administrator/permission/:Id','/administrator/setPermission']},
    // file management permissions
    {Permission: 'manageFiles', default_client: true, default_pm: true, default_dev: true,
    roads: ['/fileUpload/','/shareFile/:user/:file','/deleteFiles/:user/:file','/received/:user/:team','/files/:user/:team']},
  ],
}
