const nchanKey = 'HT67ghka9ygt7y8dhgh8290'
const nchanHost = '138.68.148.159:8080'

const nchanConf = {
    pubUrl:  nchanHost + 'notificationpub?id=' + nchanKey + '&userId=',
    subUrl: nchanHost + 'notificationsub?id=' + nchanKey + '&userId=',
}

const userTypes = {
    team: 1,
    developer: 2,
    pm: 3,
}

// url + team id + user id + type
const hire_confirmation_page = 'localhost:8080/user/confirm_hire?teamId=';

module.exports = {
    nchanConf,
    userTypes,
    hire_confirmation_page,
};