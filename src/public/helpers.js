const uuidv4 = require('uuid/v4');

module.exports = {
    getUUID: function () {
        return uuidv4();
    },
    // serializeMap: function (obj) {
    //     return Object.keys(obj).map(function (id) {
    //         if (id[0] !== '_') {
    //             return obj[id].serialize();
    //         } else {
    //             return obj[id];
    //         }
    //     });
    // },
    rand: function (min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
}
