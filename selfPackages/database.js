const mysql = require('mysql2/promise');
const crypter = require('./crypto');
const fileJob = require('./fileJobs');
const fs = require('fs');

const pool = mysql.createPool({
  host: '',
  user: '',
  password: '',
  database: '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function queryDatabase(query, params) {
  let connection;
  try {
    connection = await pool.getConnection();
    const [rows, fields] = await connection.execute(query, params);
    return { rows, fields };
  } catch (error) {
    console.error(error);
    return null;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// Login Modules

module.exports.login = async (username, password, hashKey) => {
    const response = await queryDatabase('SELECT password FROM users WHERE email = ?', [username]);

    let databasePassword = response.rows[0]['password'];
    let newEncrypted = crypter.encryptPassword(password, hashKey);
    
    if(databasePassword == newEncrypted){
        return true;
    }
    else{
        return false;
    }
}

module.exports.getImageURL = async (username) => {
    const response = await queryDatabase('SELECT image FROM users WHERE email = ?', [username]);
    
    return response.rows[0]['image'];
}

module.exports.getViewUsername = async (username) => {
    const response = await queryDatabase('SELECT username FROM users WHERE email = ?', [username]);
    
    return response.rows[0]['username'];
}

module.exports.generateToken = async (username) => {
    const token = crypter.generateToken();
    const response = await queryDatabase('UPDATE users SET token = ? WHERE email = ?', [token, username]);
    return token;
}

module.exports.controlToken = async (username, token) => {
    const response = await queryDatabase('SELECT username, token FROM users WHERE email = ? and token = ?', [username, token]);
    if(response.rows.length != 1){
        return false;
    }
    return true;
}

module.exports.getConnectedFirm = async (token) => {
    const response = await queryDatabase('SELECT connectedFirm FROM users WHERE token = ?', [token]);
    if(response == null || response.rows.length != 1){
        return false;
    }
    return response.rows[0]['connectedFirm'];
}

module.exports.isAdmin = async (token) => {
    const response = await queryDatabase('SELECT isAdmin FROM users WHERE token = ?', [token]);
    if(response == null || response.rows.length != 1){
        return false;
    }
    let isAdmin = true ? response.rows[0]['isAdmin'] == 1 : false;
    return isAdmin;
}

module.exports.getFirmInformation = async (firm) => {
    const response = await queryDatabase('SELECT firmLogo, firmBottomLogo FROM firms WHERE id = ?', [firm]);
    if(response == null || response.rows.length != 1){
        return false;
    }
    return response.rows[0];
}


module.exports.getAllFirms = async () => {
    const response = await queryDatabase('SELECT id, firmName FROM firms');
    if(response == null || response.rows.length < 1){
        return false;
    }
    return response.rows;
}

// Get Modules

module.exports.getDevices = async (firm) => {
    const result = await queryDatabase('SELECT id, deviceID, deviceName, deviceContent, buttonCount, connectedFirm, deviceFolders, printed, paperLeft, lastOnline, isActive, longitude, latitude, printerStatus, printerStatusColor FROM devices WHERE connectedFirm = ?', [firm]);

    if(result.rows.length < 1){
        return false;
    }

    return result.rows;
}

module.exports.getDeviceInformation = async (connectedFirm, deviceID) => {
    const result = await queryDatabase('SELECT id, deviceID, deviceName, deviceContent, buttonCount, connectedFirm, deviceFolders, printed, paperLeft, clock_time, lastOnline, isActive, longitude, latitude FROM devices WHERE connectedFirm = ? and deviceID = ?', [connectedFirm, deviceID]);

    if(result.rows.length != 1){
        return false;
    }

    return result.rows[0];
}

module.exports.getCategories = async (firm) => {
    const result = await queryDatabase('SELECT id, categoryName, (SELECT COUNT(*) FROM contents WHERE connectedFirm = ? AND category = categories.id) AS contentCount FROM categories WHERE connectedFirm = ? ORDER BY categoryName', [firm, firm]);

    if(result.rows.length < 1){
        return false;
    }

    return result.rows;
}

module.exports.getFreeCategories = async () => {
    const result = await queryDatabase('SELECT id, categoryName, image_url FROM categories WHERE connectedFirm = 0 ORDER BY categoryName');

    if(result.rows.length < 1){
        return false;
    }

    return result.rows;
}

module.exports.getFreeCategoryName = async (id) => {
    const result = await queryDatabase('SELECT id, categoryName FROM categories WHERE connectedFirm = 0 AND id = ?', [id]);

    if(result.rows.length < 1){
        return false;
    }

    return result.rows[0]['categoryName'];
}

module.exports.getFreeContents = async (id) => {
    const result = await queryDatabase('SELECT * FROM contents WHERE connectedFirm = 0 AND category = ?', [id]);

    if(!result || !result.rows || result.rows.length < 1){
        return false;
    }

    return result.rows;
}

module.exports.getContents = async (connectedFirm) => {
    const result = await queryDatabase('SELECT D.id, D.contentHeader, D.creationTime, C.categoryName FROM bhs_database.categories C INNER JOIN bhs_database.contents D ON C.id = D.category WHERE D.connectedFirm = ?', [connectedFirm]);
    if(result.rows.length < 1){
        return false;
    }

    return result.rows;
}

module.exports.getContentsbyCategory = async (connectedFirm, c_id) => {
    const result = await queryDatabase('SELECT D.id, D.contentHeader, D.creationTime, C.categoryName FROM bhs_database.categories C INNER JOIN bhs_database.contents D ON C.id = D.category WHERE D.connectedFirm = ? AND C.id = ?', [connectedFirm, c_id]);
    if(result.rows.length < 1){
        return false;
    }

    return result.rows;
}

module.exports.getContent = async (connectedFirm, contentID) => {
    const result = await queryDatabase('SELECT contentHeader, content, category FROM contents WHERE connectedFirm = ? and id = ?', [connectedFirm, contentID]);
    if(result.rows.length != 1){
        return false;
    }

    return result.rows[0];
}

module.exports.getFreeContent = async (contentID) => {
    const result = await queryDatabase('SELECT contentHeader, content, category FROM contents WHERE connectedFirm = ? and id = ?', [0, contentID]);
    if(result.rows.length != 1){
        return false;
    }

    return result.rows[0];
}

module.exports.getLastContents = async (connectedFirm) => {
    const result = await queryDatabase('SELECT D.id, D.contentHeader, D.creationTime, C.categoryName FROM bhs_database.categories C INNER JOIN bhs_database.contents D ON C.id = D.category WHERE D.connectedFirm = ? ORDER BY D.id LIMIT 6', [connectedFirm]);
    if(result.rows.length < 1){
        return false;
    }

    return result.rows;
}

module.exports.getPDFName = async (connectedFirm, pdfID) => {
    const result = await queryDatabase('SELECT pdfID FROM contents WHERE connectedFirm = ? and id = ?', [connectedFirm, pdfID]);

    if(result.rows.length < 1){
        return false;
    }

    return result.rows[0];
}

module.exports.getAllPDFDetails = async (connectedFirm, pdfs) => {
    const pdfList = pdfs.join(',');
    const result = await queryDatabase('SELECT pdfID, contentHeader FROM contents WHERE connectedFirm = ? AND id IN (' + pdfList + ')', [connectedFirm]);
      
    if (result.rows.length < 1) {
      return false;
    }
  
    return result.rows;
}

module.exports.pdfDetailsForRegenerate = async (connectedFirm) => {
    const result = await queryDatabase('SELECT * FROM contents WHERE connectedFirm = ?', [connectedFirm]);
      
    if (result.rows.length < 1) {
      return false;
    }
  
    return result.rows;
}
  

// Insert Modules

module.exports.insertNewCategory = async (connectedFirm, categoryName) => {
    const result = await queryDatabase('INSERT INTO categories(connectedFirm, categoryName) VALUES (?, ?)', [connectedFirm, categoryName]);
    // console.log(result);
    if(result != null){
        return true;
    }
    return {msg: "Yeni kategori oluşturulurken sorun oluştu. Lütfen sayfayı yenileyiniz ya da ekibimize ulaşınız."};
}

module.exports.insertNewContent = async (connectedFirm, category, contentHeader, contentIntext, pdfID) => {
    const result = await queryDatabase('INSERT INTO contents(connectedFirm, category, contentHeader, content, pdfID) VALUES (?, ?, ?, ?, ?)', [connectedFirm, category, contentHeader, contentIntext, pdfID]);
    if(result != null){
        return true;
    }
    return {msg: "Yeni içerik oluşturulurken sorun oluştu. Lütfen sayfayı yenileyiniz ya da ekibimize ulaşınız."};
}

module.exports.insertFreeCategory = async (connectedFirm, categoryName) => {
    const result = await queryDatabase('INSERT INTO categories(connectedFirm, categoryName) VALUES (?, ?)', [connectedFirm, categoryName]);
    // console.log(result);
    if(result != null){
        return result.rows.insertId;
    }
    return false;
}

// Update Modules

module.exports.updateContent = async (connectedFirm, category, contentHeader, contentIntext, pdfID, contentID) => {
    const result = await queryDatabase('UPDATE contents SET category = ?, contentHeader = ?, content = ?, pdfID = ? WHERE id = ? AND connectedFirm = ?', [category, contentHeader, contentIntext, pdfID, contentID, connectedFirm]);
    if(result != null){
        return true;
    }
    return {msg: "Yeni içerik oluşturulurken sorun oluştu. Lütfen sayfayı yenileyiniz ya da ekibimize ulaşınız."};
}

module.exports.updateDeviceInformation = async (connectedFirm, deviceID, deviceName, deviceContent) => {
    const result = await queryDatabase('UPDATE devices SET deviceName = ?, deviceContent = ? WHERE connectedFirm = ? AND deviceID = ?', [deviceName, deviceContent, connectedFirm, deviceID]);
    if (result && result.rows && result.rows.length > 0) {
        return true;
    } else {
        return {msg: "İşlem tamamlanamadı"};
    }
}

module.exports.updateDeviceButtons = async (connectedFirm, deviceID, deviceFolders) => {
    const result = await queryDatabase('UPDATE devices SET deviceFolders = ? WHERE connectedFirm = ? AND deviceID = ?', [deviceFolders, connectedFirm, deviceID]);
    if (result && result.rows && result.rows.length > 0) {
        return true;
    } else {
        return {msg: "İşlem tamamlanamadı"};
    }
}

module.exports.updateDeviceClock = async (connectedFirm, deviceID, time) => {
    const result = await queryDatabase('UPDATE devices SET clock_time = ? WHERE connectedFirm = ? AND deviceID = ?', [time, connectedFirm, deviceID]);
    if (result && result.rows && result.rows.length > 0) {
        return true;
    } else {
        return {msg: "İşlem tamamlanamadı"};
    }
}

module.exports.updateCategoryName = async (connectedFirm, categoryID, categoryName) => {
    const result = await queryDatabase('UPDATE categories SET categoryName = ? WHERE connectedFirm = ? AND id = ?', [categoryName, connectedFirm, categoryID]);
    if (result && result.rows && result.rows.length > 0) {
        return true;
    } else {
        return {msg: "İşlem tamamlanamadı"};
    }
}

module.exports.updatePersonalInformation = async (viewName, photoURL = undefined, token) => {
    if(photoURL == undefined){
        const result = await queryDatabase('UPDATE users SET username = ? WHERE token = ?', [viewName, token]);
        if (result && result.rows && result.rows.length > 0) {
            return true;
        } else {
            return {msg: "İşlem tamamlanamadı"};
        }
    }
    else{
        const result = await queryDatabase('UPDATE users SET username = ?, image = ? WHERE token = ?', [viewName, photoURL, token]);
        if (result && result.rows && result.rows.length > 0) {
            return true;
        } else {
            return {msg: "İşlem tamamlanamadı"};
        }
    }
}

module.exports.updatePersonalInformation_photo = async (photoURL = undefined, token) => {
    const result = await queryDatabase('UPDATE users SET image = ? WHERE token = ?', [photoURL, token]);
    if (result && result.rows && result.rows.length > 0) {
        return true;
    } else {
        return {msg: "İşlem tamamlanamadı"};
    }
}

module.exports.updateFirmInformation = async (photo1 = undefined, photo2 = undefined, firm) => {

    if(photo1 != undefined){
        const result = await queryDatabase('UPDATE firms SET firmLogo = ? WHERE id = ?', [photo1, firm]);
        if (result && result.rows && result.rows.length > 0) {
            return true;
        } else {
            return {msg: "İşlem tamamlanamadı"};
        }
    }

    if(photo2 != undefined){
        const result = await queryDatabase('UPDATE firms SET firmBottomLogo = ? WHERE id = ?', [photo2, firm]);
        if (result && result.rows && result.rows.length > 0) {
            return true;
        } else {
            return {msg: "İşlem tamamlanamadı"};
        }
    }
}

module.exports.updateAdminFirm = async (firm, token) => {
    const result = await queryDatabase('UPDATE users SET connectedFirm = ? WHERE token = ?', [firm, token]);
    if (result && result.rows && result.rows.length > 0) {
        return true;
    } else {
        return {msg: "İşlem tamamlanamadı"};
    }
}

// File Permissions

module.exports.controlCategoryPermission = async (token, categoryID) => {
    const userResponse = await queryDatabase('SELECT connectedFirm FROM users WHERE token = ?', [token]);
    if(userResponse.rows[0]['connectedFirm']){
        const contentResponse = await queryDatabase('SELECT connectedFirm FROM categories WHERE id = ?', [categoryID]);
        if(!contentResponse.rows[0]){
            return {msg: "İçerik Bulunamadı."};
        }
        let userConnectedFirm = userResponse.rows[0]['connectedFirm'];
        let contentConnectedFirm = contentResponse.rows[0]['connectedFirm'];
        if(userConnectedFirm == contentConnectedFirm){
            return true;
        }
        else{
            return {msg: "Kategori silmek için yetkiniz bulunmamaktadır."};
        }
    }
    else{
        return {msg: "Yetersiz işlem."};
    }
}

module.exports.controlContentPermission = async (token, contentID) => {
    const userResponse = await queryDatabase('SELECT connectedFirm FROM users WHERE token = ?', [token]);
    if(userResponse.rows[0]['connectedFirm']){
        const contentResponse = await queryDatabase('SELECT connectedFirm FROM contents WHERE id = ?', [contentID]);
        if(!contentResponse.rows[0]){
            return {msg: "İçerik Bulunamadı."};
        }
        let userConnectedFirm = userResponse.rows[0]['connectedFirm'];
        let contentConnectedFirm = contentResponse.rows[0]['connectedFirm'];
        if(userConnectedFirm == contentConnectedFirm){
            return true;
        }
        else{
            return {msg: "Dosya silmek için yetkiniz bulunmamaktadır."};
        }
    }
    else{
        return {msg: "Yetersiz işlem."};
    }
}

// Delete Modules

module.exports.deleteCategory = async (categoryID) => {
    const contents = await queryDatabase('SELECT pdfID FROM contents WHERE category = ?', [categoryID]);

    for (let i = 0; i < contents.rows.length; i++) {
        const element = contents.rows[i];
        try {
            fileJob.removePDF(element['pdfID']);
        } catch (error) {
            //
        }
    }


    const response = await queryDatabase('DELETE FROM contents WHERE category = ?', [categoryID]);
    const responsee = await queryDatabase('DELETE FROM categories WHERE id = ?', [categoryID]);
    return true;
}

module.exports.deleteContent = async (contentID) => {
    const contentFileID = await queryDatabase('SELECT pdfID FROM contents WHERE id = ?', [contentID]);

    if(!contentFileID.rows[0]){
        return {msg: "İçeriği silerken sorun oluştu."};
    }

    fileJob.removePDF(contentFileID.rows[0]['pdfID']);

    const response = await queryDatabase('DELETE FROM contents WHERE id = ?', [contentID]);
    
    if(response == null){
        return {msg: "İçeriği silerken sorun oluştu."};
    }

    return true;
}

//Control Modules

module.exports.controlInsertAccess = async (connectedFirm, category) => {
    const response = await queryDatabase('SELECT * FROM categories WHERE connectedFirm = ? and id = ?', [connectedFirm, category]);
    if(response == null || response.rows.length != 1){
        return false;
    }
    return true;
}