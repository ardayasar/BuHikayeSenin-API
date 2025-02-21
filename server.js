const api = require('./selfPackages/database');
const files = require('./selfPackages/fileJobs');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const cors = require('cors');
// const { v4: uuidv4 } = require('uuid');

const express = require('express');
const server = express();

const http = require('http');
const mainServer = http.createServer(server);
const { Server } = require("socket.io");
const io = new Server(mainServer);

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

server.use(cors({
    origin: 'https://panel.buhikayesenin.com',
    credentials: true
}));

server.use(express.json());
server.use(express.urlencoded( {extended: true} ));
server.set('io', io);
server.use(cookieParser());

server.use('/logos', express.static('logos'));
server.use('/user_uploads', express.static('user_uploads'));

var settings = {
    projectName: "BHS",
    projectRoot: __dirname,
    port: 2020,
    sessionExpire_day: 1440, //Minute
    sessionExpire_week: 10080, //Minute
    hashKey: "3has-key2",
}

const pages = {
    // User Endpoint
    userLogin: '/login',
    registerUser: '/register',
    // Get Commands
    getDeviceInformation: '/getDeviceInformation',
    getAllDevices: '/allDevices',
    getCategories: '/getCategories',
    getFreeCategories: '/getFreeCategories',
    getFreeCategoriesName: '/getFreeCategoriesName',
    getFreeContents: '/getFreeContents', 
    getContents: '/getContents',
    getContents_category: '/getContents_category',
    getLastContents: '/getLastContents',
    getContent: '/getContent',
    getFreeContent: '/getFreeContent',
    getPDF: '/getPDF',
    downloadPDFs: '/downloadPDFs',
    downloadZip: '/downloadZIP',
    getSettings: '/getSettings',
    getAdminPriv: '/firm_selection',
    // Set Commands
    updateDeviceInformation: '/updateDeviceInformation',
    updateDeviceButtons: '/updateDeviceButtons',
    updateDeviceClock: '/updateDeviceClock',
    updateCategory: '/updateCategory',
    updateContent: '/updateContent',
    updatePersonalInformation: '/updatePersonalInformation',
    updateFirmInformation: '/updateFirmInformation',
    uploadNewPhoto: '/uploadPhoto',
    updateAdminFirm: "/updateAdminFirm",
    // Delete Commands
    deleteCategory: '/deleteCategory',
    deleteContent: '/deleteContent',
    deleteImages: '/deleteImages',
    // Insert Commands
    insertFreeCategory: '/addFreeCategories',
    insertNewCategory: '/insertNewCategory',
    insertFreeContent: '/insertFreeContent',
    insertNewContent: '/insertNewContent',
    // Device Timing Command
    changeDeviceStatus: '/changeDeviceStatus'
}

server.use(async function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', 'https://panel.buhikayesenin.com');
    // res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', '*');

    if (req.path !== pages.userLogin) {

        let token = req.cookies.token;
        let username = req.cookies.username;

        if(!token || !username){
            res.redirect("https://panel.buhikayesenin.com/");
            return;
        }

        let isTokenTrue = await api.controlToken(username, token);

        if(!isTokenTrue){
            res.redirect("https://panel.buhikayesenin.com/");
            return;
        }
    }
    next();
});

server.post(pages.userLogin, async (req, res) => {
    const username = req.body.email;
    const password = req.body.sifrex;

    let loginAvailable = await api.login(username, password, settings.hashKey);
    
    if(!loginAvailable){
        res.clearCookie();
        res.redirect("https://panel.buhikayesenin.com/");
        return;
    }

    let token = await api.generateToken(username);
    let image_url = await api.getImageURL(username);
    let viewUsername = await api.getViewUsername(username);
    
    res.cookie('username', username, { 
        domain: '.buhikayesenin.com', 
        path: '/', 
        sameSite: 'none', 
        secure: true 
    });

    res.cookie('viewUsername', viewUsername, { 
        domain: '.buhikayesenin.com', 
        path: '/', 
        sameSite: 'none', 
        secure: true 
    });

    res.cookie('token', token, { 
        domain: '.buhikayesenin.com', 
        path: '/', 
        sameSite: 'none', 
        secure: true 
    });

    res.cookie('image_url', image_url, { 
        domain: '.buhikayesenin.com', 
        path: '/', 
        sameSite: 'none', 
        secure: true 
    });

    res.redirect('https://panel.buhikayesenin.com/v2.0/');
});

// Get Methods

server.get(pages.getAllDevices, async (req, res) => {
    let token = req.cookies.token;
    let connectedFirm = await api.getConnectedFirm(token);
    
    let results = await api.getDevices(connectedFirm);
    if(results == false){
        res.send({task: false, err: {msg: "Cihaz bulunamadı"}});
        return;
    }

    res.send({task: true, results: results});
});

server.get(pages.getSettings, async (req, res) => {
    let token = req.cookies.token;

    let connectedFirm = await api.getConnectedFirm(token);
    let firmData = await api.getFirmInformation(connectedFirm);

    if(firmData == false){
        res.send({task: false, err: firmData});
        return;
    }

    res.send({task: true, results: firmData});
});

server.get(pages.getAdminPriv, async (req, res) => {
    let token = req.cookies.token;

    let isAdmin = await api.isAdmin(token);

    if(isAdmin == false){
        res.send({task: false});
        return;
    }

    let allFirms = await api.getAllFirms();
    let currentFirm = await api.getConnectedFirm(token);

    res.send({task: true, results: allFirms, currentFirm: currentFirm});
});

server.get(pages.getCategories, async (req, res) => {
    let token = req.cookies.token;
    
    let connectedFirm = await api.getConnectedFirm(token);
    let results = await api.getCategories(connectedFirm);
    if(results == false){
        res.send({task: false, err: {msg: "Kategori Bulunamadı"}});
        return;
    }

    res.send({task: true, results: results});
});

server.get(pages.getFreeCategories, async (req, res) => {
    let token = req.cookies.token;
    
    let results = await api.getFreeCategories();
    if(results == false){
        res.send({task: false, err: {msg: "Kategori Bulunamadı"}});
        return;
    }

    res.send({task: true, results: results});
});

server.post(pages.getFreeCategoriesName, async (req, res) => {
    let token = req.cookies.token;

    let categoryID = req.body.categoryID;
    
    let categoryName = await api.getFreeCategoryName(categoryID);

    if(categoryName == false){
        res.send({task: false, err: {msg: "Kategori Bulunamadı"}});
        return;
    }

    res.send({task: true, categoryName: categoryName});
});

server.post(pages.getFreeContents, async (req, res) => {
    let token = req.cookies.token;
    
    let requestCategory = req.body.categoryID;
    
    let results = await api.getFreeContents(requestCategory);

    if(results == false){
        res.send({task: false, err: {msg: "Kategori Bulunamadı"}});
        return;
    }

    res.send({task: true, results: results});
});

server.get(pages.getContents, async (req, res) => {
    let token = req.cookies.token;
    
    let connectedFirm = await api.getConnectedFirm(token);
    let results = await api.getContents(connectedFirm);
    if(results == false){
        res.send({task: false, err: {msg: "İçerik Bulunamadı"}});
        return;
    }

    res.send({task: true, results: results});
});

server.get(pages.getContents_category, async (req, res) => {
    let token = req.cookies.token;
    let categoryID = req.query.c_id;
    
    let connectedFirm = await api.getConnectedFirm(token);
    let results = await api.getContentsbyCategory(connectedFirm, categoryID);
    if(results == false){
        res.send({task: false, err: {msg: "İçerik Bulunamadı"}});
        return;
    }

    res.send({task: true, results: results});
});

server.get(pages.getLastContents, async (req, res) => {
    let token = req.cookies.token;
    
    let connectedFirm = await api.getConnectedFirm(token);
    let results = await api.getLastContents(connectedFirm);
    if(results == false){
        res.send({task: false, err: {msg: "İçerik Bulunamadı"}});
        return;
    }

    res.send({task: true, results: results});
});

server.post(pages.getContent, async (req, res) => {
    let token = req.cookies.token;
    
    let requestContent = req.body.contentID;
    let connectedFirm = await api.getConnectedFirm(token);
    let results = await api.getContent(connectedFirm, requestContent);
    if(results == false){
        res.send({task: false, err: {msg: "İçerik Bulunamadı"}});
        return;
    }

    res.send({task: true, results: results});
});

server.post(pages.getFreeContent, async (req, res) => {
    let token = req.cookies.token;
    
    let requestContent = req.body.contentID;

    let results = await api.getContent(0, requestContent);
    if(results == false){
        res.send({task: false, err: {msg: "İçerik Bulunamadı"}});
        return;
    }

    res.send({task: true, results: results});
});

server.post(pages.getDeviceInformation, async (req, res) => {
    let token = req.cookies.token;
    let deviceID = req.body.deviceID;

    if(!deviceID){
        res.send({task: false, err: {msg: "Eksik bilgiler bulunmakta"}});
        return;
    }

    let connectedFirm = await api.getConnectedFirm(token);

    let deviceInfo = await api.getDeviceInformation(connectedFirm, deviceID);
    if(deviceInfo == false){
        res.send({task: false, err: {msg: "İçerik Bulunamadı"}});
        return;
    }

    res.send({task: true, results: deviceInfo});
});

server.post(pages.getPDF, async (req, res) => {
    let token = req.cookies.token;
    let fileID = req.body.fileID;

    if(!fileID){
        res.send({task: false, err: {msg: "Eksik bilgiler bulunmakta"}});
        return;
    }

    let connectedFirm = await api.getConnectedFirm(token);
    
    let pdfName = await api.getPDFName(connectedFirm, fileID);

    if(pdfName == false){
        res.send({task: false, err: {msg: "İçerik Bulunamadı"}});
        return;
    }

    res.sendFile(`${__dirname}/uploads/${pdfName['pdfID']}.pdf`);
});

// INSERT COMMANDS

server.post(pages.insertFreeContent, async (req, res) => {
    let token = req.cookies.token;
    let contents = req.body.contents;
    let categoryID = req.body.category;

    if(!contents){
        res.send({task: false, err: {msg: "İçerikler aktarılırken sorun oluştu."}});
        return;
    }

    if(!categoryID){
        res.send({task: false, err: {msg: "İçerikler aktarılırken sorun oluştu."}});
        return;
    }

    let userFirm = await api.getConnectedFirm(token);

    if(userFirm == false){
        res.send({task: false, err: {msg: "İşlem yapılamaz!"}});
        return;
    }

    let control = await api.controlCategoryPermission(token, categoryID);
    
    if(control != true){
        res.send({task: false, err: control});
        return;
    }

    // 
    let firmDetails = await api.getFirmInformation(userFirm);
    // 

    for (let k = 0; k < contents.length; k++) {
        const contentID = contents[k];
        let contentInformation = await api.getFreeContent(contentID);

        let unqFile = await files.createHTML(contentInformation.content);
        if(unqFile == false){
            continue;
        }

        let proc = await files.createPDF(`uploads/${unqFile}`, firmDetails['firmLogo'], firmDetails['firmBottomLogo']);

        if(!proc){
            res.send({task: false, err: {msg: "Sorunlu dosya!"}});
            return;
        }

        files.removeHTML(unqFile);
        await api.insertNewContent(userFirm, categoryID, contentInformation.contentHeader, contentInformation.content, unqFile);
    };


    res.send({task: true});
});

server.post(pages.insertFreeCategory, async (req, res) => {
    let token = req.cookies.token;
    let categories = req.body.categories;

    if(!categories){
        res.send({task: false, err: {msg: "Kategoriler aktarılırken sorun oluştu."}});
        return;
    }

    let categoryFirm = await api.getConnectedFirm(token);
    if(categoryFirm == false){
        res.send({task: false, err: {msg: "İşlem yapılamaz!"}});
        return;
    }

    let firmDetails = await api.getFirmInformation(categoryFirm);

    for (let k = 0; k < categories.length; k++) {
        const categoryID = categories[k];
        
        let categoryName = await api.getFreeCategoryName(categoryID);
        let categoryInsertID = await api.insertFreeCategory(categoryFirm, categoryName);
        let fullList = await api.getFreeContents(categoryID);

        for (let y = 0; y < fullList.length; y++) {
            const content = fullList[y];
            try {
                let unqFile = await files.createHTML(content['content']);
                if(unqFile != false){
                    let proc = await files.createPDF(`uploads/${unqFile}`, firmDetails['firmLogo'], firmDetails['firmBottomLogo']);

                    if(!proc){
                        res.send({task: false, err: {msg: "Sorunlu dosya!"}});
                        return;
                    }

                    files.removeHTML(unqFile);

                    await api.insertNewContent(categoryFirm, categoryInsertID, content['contentHeader'], content['content'], unqFile);
                }
            } catch (error) {
                console.log(error);
            }
        };
    };


    res.send({task: true});
});
// 
server.post(pages.insertNewCategory, async (req, res) => {
    let token = req.cookies.token;
    let categoryName = req.body.categoryName;

    if(!categoryName){
        res.send({task: false, err: {msg: "İçerik numarası bulunamadı. Lütfen sayfayı yenileyiniz."}});
        return;
    }

    let categoryFirm = await api.getConnectedFirm(token);
    if(categoryFirm == false){
        res.send({task: false, err: {msg: "İşlem yapılamaz!"}});
        return;
    }

    let isInserted = await api.insertNewCategory(categoryFirm, categoryName);
    res.send({task: isInserted});
});

server.post(pages.insertNewContent, upload.single('file'), async (req, res) => {
    let token = req.cookies.token;
    let category = req.body.categoryID;
    let contentHeader = req.body.contentHeader;
    let file = req.file;
    let contentID = req.body.contentID;
    
    if(!category || !contentHeader || !file){
        res.send({task: false, err: {msg: "Eksik bilgi(ler) bulunmakta."}});
        return;
    }

    let connectedFirm = await api.getConnectedFirm(token);
    if(connectedFirm == false){
        res.send({task: false, err: {msg: "İşlem yapılamaz!"}});
        return;
    }

    let controlCategoryID = await api.controlInsertAccess(connectedFirm, category);
    if(!controlCategoryID){
        res.send({task: false, err: {msg: "Lütfen sayfanızı yenileyerek tekrar deneyiniz."}});
        return;
    }

    if(contentID){
        let controlContentID = await api.getContent(connectedFirm, contentID);

        if(controlContentID == false){
            res.send({task: false, err: {msg: "Bilgiler eşleşmemektedir."}});
            return;
        }
    }

    let images = await api.getFirmInformation(connectedFirm);
    var content = fs.readFileSync('./uploads/' + file.filename, {encoding: 'utf-8'});
    let proc = await files.createPDF(`uploads/${file.filename}`, images['firmLogo'], images['firmBottomLogo']);
    
    if(!proc){
        res.send({task: false, err: {msg: "Sorunlu dosya!"}});
        return;
    }

    if(contentID){
        let isUpdated = await api.updateContent(connectedFirm, category, contentHeader, content, file.filename, contentID);
        if(isUpdated != true){
            res.send({task: false, err: isUpdated});
        }
    }
    else{
        let isInserted = await api.insertNewContent(connectedFirm, category, contentHeader, content, file.filename);
        if(isInserted != true){
            res.send({task: false, err: isInserted});
        }
    }
    
    res.send({task: true, redirect: 'https://panel.buhikayesenin.com/v2.0/'});
});

// server.get('/generateAllPdfsAgain', async (req, res) => {
//     let token = req.cookies.token;
//     let firm = req.query.firmID;

//     let images = await api.getFirmInformation(firm);
//     let contentIntext = await api.pdfDetailsForRegenerate(firm);
//     res.send({status: true, data: contentIntext});
//     for(var i = 0; i < contentIntext.length; i++){
//         let content = contentIntext[i];
//         let pdfID = content.pdfID;
//         fs.writeFileSync(`${__dirname}/uploads/${pdfID}`, content.content);
        
//         let proc = await files.createPDF(`uploads/${pdfID}`, images['firmLogo'], images['firmBottomLogo']);
//         if(proc){
//             await api.updateContent(firm, content.category, content.contentHeader, content.content, pdfID, content.id);
//         }
//     }
    
//     res.send({task: true, redirect: 'https://panel.buhikayesenin.com/v2.0/'});
// });

server.post(pages.downloadPDFs, async (req, res) => {
    let token = req.cookies.token;
    let pdflist = req.body.pdfs;

    if(!pdflist){
        res.send({task: false, err: {msg: "İçerik bulunamadı."}});
        return;
    }

    let categoryFirm = await api.getConnectedFirm(token);

    if(categoryFirm == false){
        res.send({task: false, err: {msg: "İşlem yapılamaz!"}});
        return;
    }  

    let pdfdetails = await api.getAllPDFDetails(categoryFirm, pdflist);

    if(pdfdetails == false){
        res.send({task: false, err: {msg: "PDF bulunamadı"}});
        return;
    }

    let zipName = await files.makeZipReady(pdfdetails);

    if(zipName == false){
        res.send({task: false, err: {msg: "Dosya indirilirken sorun oluştu."}});
        return;
    }

    res.send({task: true, fileName: `${zipName}.zip`});
});

server.get(pages.downloadZip, async (req, res) => {
    let file = req.query.zip;
    res.setHeader('Content-Disposition', 'attachment; filename="icerikler.zip"');
    res.sendFile(`${__dirname}/zipper/${file}`);
});

// UPDATE MODELS

server.post(pages.updatePersonalInformation, upload.single('file'), async (req, res) => {
    let token = req.cookies.token;
    let viewName = req.body.username;
    var file = undefined;

    if(!viewName || !token){
        res.send({task: false, err: {msg: 'Not Permitted'}});
        return;
    }
    
    if(req.file){
        try {
            fs.renameSync('./uploads/' + req.file.filename, './logos/' + req.file.filename + '.png', (err) => {
                if(err){
                    res.send({task: false});
                    return;
                }
            });
            file = 'https://api.buhikayesenin.com/logos/' + req.file.filename + '.png';
        } catch (error) {
            res.send({task: false, err: error});
            return;
        }
    }

    let isUpdated = await api.updatePersonalInformation(viewName, file, token);

    if(isUpdated){
        res.cookie('viewUsername', viewName, { 
            domain: '.buhikayesenin.com', 
            path: '/', 
            sameSite: 'none', 
            secure: true 
        });

        res.cookie('image_url', file, { 
            domain: '.buhikayesenin.com', 
            path: '/', 
            sameSite: 'none', 
            secure: true 
        });
        
        res.send({task: true, results: {image_url: file, username: viewName}});
    }
    else{
        res.send({task: false, err: isUpdated});
    }
});

server.post(pages.updateFirmInformation, upload.single('file'), async (req, res) => {
    let token = req.cookies.token;
    let changePhoto = req.body.which;

    if(!token){
        res.send({task: false, err: {msg: 'Not Permitted'}});
        return;
    }

    let firmID = await api.getConnectedFirm(token);
    
    var photo1_url = undefined;
    var photo2_url = undefined;

    if(req.file){
        try {
            fs.renameSync('./uploads/' + req.file.filename, './logos/' + req.file.filename + '.png', (err) => {
                if(err){
                    res.send({task: false});
                    return;
                }
            });
            if(changePhoto == 1){
                photo1_url = req.file.filename + '.png';
            }
            else{
                photo2_url = req.file.filename + '.png';
            }
        } catch (error) {
            res.send({task: false, err: error});
            return;
        }
    }

    let isUpdated = await api.updateFirmInformation(photo1_url, photo2_url, firmID);

    if(isUpdated){
        res.send({task: true});
    }
    else{
        res.send({task: false, err: isUpdated});
    }
});

server.post(pages.uploadNewPhoto, upload.single('file'), async (req, res) => {
    let token = req.cookies.token;
    var file = undefined;

    if(!token){
        res.send({task: false, err: {msg: 'Not Permitted'}});
        return;
    }
    
    if(req.file){
        try {
            fs.renameSync('./uploads/' + req.file.filename, './user_uploads/' + req.file.filename + '.png', (err) => {
                if(err){
                    res.send({task: false});
                    return;
                }
            });
            file = 'https://api.buhikayesenin.com/user_uploads/' + req.file.filename + '.png';
            res.send({task: true, results: {image_url: file}});
        } catch (error) {
            res.send({task: false, err: error});
            return;
        }
    }
    else{
        res.send({task: false, err: {msg: 'Undefined photo data'}});
    }
});

server.get(pages.updateAdminFirm, async (req, res) => {
    let token = req.cookies.token;
    let firmID = req.query.firm;

    if(!token){
        res.send({task: false, err: {msg: 'Not Permitted'}});
        return;
    }
    
    let isAdmin = await api.isAdmin(token);

    if(isAdmin == false){
        res.send({task: false, err: {msg: 'Not Permitted'}});
        return;
    }

    let isUpdated = await api.updateAdminFirm(firmID, token);

    if(isUpdated){
        res.send({task: true});
    }
    else{
        res.send({task: false, err: isUpdated});
    }
});


server.get(pages.deleteImages, async (req, res) => {
    let token = req.cookies.token;
    let which = req.query.which;

    if(!token){
        res.send({task: false, err: {msg: 'Not Permitted'}});
        return;
    }

    let firmID = await api.getConnectedFirm(token);


    if(which == "up"){
        let isUpdated = await api.updateFirmInformation('1x1-ffffff7f.png', undefined, firmID);
        if(isUpdated){
            res.send({task: true});
        }
        else{
            res.send({task: false, err: isUpdated});
        }
    }

    if(which == "down"){
        let isUpdated2 = await api.updateFirmInformation(undefined, '1x1-ffffff7f.png', firmID);
        if(isUpdated2){
            res.send({task: true});
        }
        else{
            res.send({task: false, err: isUpdated2});
        }
    }

    if(which == "profile"){
        let isUpdated3 = await api.updatePersonalInformation_photo('https://api.buhikayesenin.com/logos/1x1-ffffff7f.png', token);
        if(isUpdated3){
            res.cookie('image_url', "https://api.buhikayesenin.com/logos/1x1-ffffff7f.png", { 
                domain: '.buhikayesenin.com', 
                path: '/', 
                sameSite: 'none', 
                secure: true 
            });
            res.send({task: true});
        }
        else{
            res.send({task: false, err: isUpdated3});
        }
    }
});


server.post(pages.updateDeviceInformation, async (req, res) => {
    let token = req.cookies.token;

    let connectedFirm = await api.getConnectedFirm(token);
    let deviceID = req.body.deviceID;
    let deviceName = req.body.deviceName;
    let deviceContent = req.body.deviceContent;

    if(connectedFirm == false){
        res.send({task: false, err: {msg: "İşlem yapılamaz!"}});
        return;
    }

    if(deviceContent.length < 1){
        deviceContent = '';
    }

    if(!deviceID || !deviceName){
        res.send({task: false, err: {msg: "Eksik bilgi(ler) bulunmakta."}});
        return;
    }

    let result = api.updateDeviceInformation(connectedFirm, deviceID, deviceName, deviceContent);
    if(!result){
        res.send({task: false, err: {msg: "Sorun yaşandı. Daha sonra tekrar deneyiniz."}});
        return;
    }

    res.send({task: true});
});

server.post(pages.updateDeviceButtons, async (req, res) => {
    let token = req.cookies.token;

    let connectedFirm = await api.getConnectedFirm(token);
    let deviceID = req.body.deviceID;
    let deviceFolders = req.body.deviceFolders;

    if(connectedFirm == false){
        res.send({task: false, err: {msg: "İşlem yapılamaz!"}});
        return;
    }

    if(!deviceID || !deviceFolders){
        res.send({task: false, err: {msg: "Eksik bilgi(ler) bulunmakta."}});
        return;
    }

    let result = api.updateDeviceButtons(connectedFirm, deviceID, deviceFolders);
    if(!result){
        res.send({task: false, err: {msg: "Sorun yaşandı. Daha sonra tekrar deneyiniz."}});
        return;
    }

    res.send({task: true});
});

server.post(pages.updateDeviceClock, async (req, res) => {
    let token = req.cookies.token;

    let connectedFirm = await api.getConnectedFirm(token);
    let deviceID = req.body.deviceID;
    let time_string = req.body.time_string;

    if(connectedFirm == false){
        res.send({task: false, err: {msg: "İşlem yapılamaz!"}});
        return;
    }

    if(!deviceID || !time_string){
        res.send({task: false, err: {msg: "Eksik bilgi(ler) bulunmakta."}});
        return;
    }

    let device_clock = time_string;

    let result = api.updateDeviceClock(connectedFirm, deviceID, device_clock);
    if(!result){
        res.send({task: false, err: {msg: "Sorun yaşandı. Daha sonra tekrar deneyiniz."}});
        return;
    }
    if(result.task == false){
        res.send({task: false, err: result.err.msg});
        return;
    }

    res.send({task: true});
});

server.post(pages.updateCategory, async (req, res) => {
    let token = req.cookies.token;

    let connectedFirm = await api.getConnectedFirm(token);
    let categoryID = req.body.categoryID;
    let categoryName = req.body.categoryName;

    if(connectedFirm == false){
        res.send({task: false, err: {msg: "İşlem yapılamaz!"}});
        return;
    }

    if(!categoryID || !categoryName){
        res.send({task: false, err: {msg: "Eksik bilgi(ler) bulunmakta."}});
        return;
    }

    let result = api.updateCategoryName(connectedFirm, categoryID, categoryName);
    if(!result){
        res.send({task: false, err: {msg: "Sorun yaşandı. Daha sonra tekrar deneyiniz."}});
        return;
    }

    res.send({task: true});
});



// DELETE MODELS

server.post(pages.deleteCategory, async (req, res) => {
    let token = req.cookies.token;
    let categoryID = req.body.categoryID;
    let connectedFirm = await api.getConnectedFirm(token);

    if(!categoryID){
        res.send({task: false, err: {msg: "İçerik numarası bulunamadı. Lütfen sayfayı yenileyiniz."}});
        return;
    }

    let filePermission = await api.controlCategoryPermission(token, categoryID);
    if(filePermission != true){
        res.send({task: false, err: filePermission});
        return;
    }

    let isDeleted = await api.deleteCategory(categoryID);
    if(isDeleted == true){
        res.send({task: isDeleted});
    }
    else{
        res.send({task: false, err: isDeleted});
    }
});

server.post(pages.deleteContent, async (req, res) => {
    let token = req.cookies.token;
    let contentID = req.body.contentID;

    if(!contentID){
        res.send({task: false, err: {msg: "İçerik numarası bulunamadı. Lütfen sayfayı yenileyiniz."}});
        return;
    }

    let filePermission = await api.controlContentPermission(token, contentID);
    if(filePermission != true){
        res.send({task: false, err: filePermission});
        return;
    }

    let isDeleted = await api.deleteContent(contentID);
    if(isDeleted == true){
        res.send({task: isDeleted});
    }
    else{
        res.send({task: false, err: isDeleted});
    }
});

mainServer.listen(settings.port, () => {
    console.log(`${settings.projectName} server started on http://localhost:${settings.port}/`)
});