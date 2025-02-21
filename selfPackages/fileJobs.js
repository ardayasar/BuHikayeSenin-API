const fs = require('fs');
const util = require('util');
const cp = require('child_process');
const exec = util.promisify(cp.exec);
const crypto = require('./crypto');
const AdmZip = require("adm-zip");
const fsx = require('fs-extra');

const source = `https://api.buhikayesenin.com/`;

module.exports.createPDF = async (file, imgup, imgdown) => {
    try {
        fs.renameSync(`${__dirname}/../${file}`, `${__dirname}/../${file}.html`);
        let originalIntext = fs.readFileSync(`${__dirname}/../${file}.html`, {encoding: 'utf-8'});

        const template_top = `<p style="text-align:center" id='phurth'><img alt="" src="${source}logos/${imgup}" style="height:auto; width:100%" /></p>`;
        const template_bottom = `<p style="text-align:center" id='phurth'><img alt="" src="${source}logos/${imgdown}" style="height:auto; width:100%" /></p>`;
        originalIntext = template_top + originalIntext + template_bottom;
        const totalHTML = `
                <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
            @import url('https://fonts.googleapis.com/css2?family=Roboto+Condensed:ital,wght@0,100..900;1,100..900&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,100;0,300;0,400;0,700;0,900;1,100;1,300;1,400;1,700;1,900&display=swap');

            html{
                width: 100%;
            }
            body{
                margin: auto;
                width: 100%;
                height: auto;
                overflow: hidden;
                word-break: keep-all;
            }
            </style>
        </head>
        <body>
        ${originalIntext}
        </body>
        <html>
        `;

        fs.writeFileSync(`${__dirname}/../${file}.html`, totalHTML);

        const { stdout } = await exec(`./selfPackages/fixer.sh ${file}`);
        console.log(stdout);
        if (stdout.includes('==> 1 page written on')) {
            fs.rmSync(`${__dirname}/../${file}.html`);
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports.createHTML = async (content) => {
    try {
        let uniqueName = crypto.generateUniqueName();
        fs.writeFileSync(`${__dirname}/../uploads/${uniqueName}`, content.toString());
        return uniqueName;
    } catch (error) {
        console.log(error);
        return false;
    }
}

module.exports.removeHTML = (html) => {
    try {
        fs.rmSync(`${__dirname}/../${html}.html`)
    } catch (error) {
        console.log('err');
    }
}

module.exports.removePDF = (pdf) => {
    try {
        fs.rmSync(`${__dirname}/../${pdf}.pdf`)
    } catch (error) {
        console.log('err');
    }
}

module.exports.makeZipReady = async (files) => {
    try{
        let folderName = crypto.generateToken(8);
        fs.mkdirSync(`${__dirname}/../zipper/${folderName}`);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileName = file['contentHeader'];
            const filePath = file['pdfID'];

            try {
                fs.copyFileSync(`${__dirname}/../uploads/${filePath}.pdf`, `${__dirname}/../zipper/${folderName}/${fileName}.pdf`);
            } catch (error) {
                continue;
            }
        }

        const zip = new AdmZip();
        const outputFile = `${__dirname}/../zipper/${folderName}.zip`;
        zip.addLocalFolder(`${__dirname}/../zipper/${folderName}`);
        zip.writeZip(outputFile);

        fsx.remove(`${__dirname}/../zipper/${folderName}`, err => {
            if (err) {
              console.error(err);
            } else {
              console.log(`Folder ${folderPath} removed successfully!`);
            }
        });

        return folderName;
    }
    catch (error) {
        return error.toString();
    }
}