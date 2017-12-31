//Scraper
const fs = require('fs');
const request = require('request');
const url = 'http://shirts4mike.com';
const cheerio = require('cheerio');
const dir = './data';
const json2csv = require('json2csv');
const csvFields = ["Title", "Price", "ImageURL", "URL", "Time"];
const errorFile = 'error.log';
var data = [];
var shirtArray = [];//Initial shirt storage
var shirtToDo = [];//Processed

console.log('Starting SCRAPPER');
//Create directory if none exists
checkDirectorySync(dir);

function checkDirectorySync(directory) {
    try {
        fs.statSync(directory);
    } catch(e) {
        console.log('Creating the directory');
        fs.mkdirSync(directory);
    }
}
//Scrape
request(url, function(error, response, body ) {
    //console.log(body);
        if(response.statusCode === 200) {
            const $ = cheerio.load(body);
            var shirts = $("a[href*='shirt']");

            shirts.each(function () {
                var link = url + '/' + $(this).attr('href');

                if(shirtArray.indexOf(link)===-1){//if link not in shirtArray
                    shirtArray.push(link);

                    //console.log(shirtArray);

                }
            });

            shirtArray.forEach(function (item) {
                if(item.indexOf('?id=')>0){//has ending query
                    shirtToDo.push(item);//add to be processed
                    //console.log(item);

                }else {//find more shirts
                    //console.log('find more');

                    request(item, function (error, response, body) {
                        if(response.statusCode === 200) {
                                const $ = cheerio.load(body);
                                var shirts = $("a[href*='shirt.php']");//grab remaining shirts

                                shirts.each(function () {
                                    var link = url + '/' + $(this).attr('href');

                                    if (shirtToDo.indexOf(link) === -1) {//if link not in shirtArray
                                        shirtToDo.push(link);
                                        shirtArray.push(link);
                                        // console.log(link);

                                    }
                                });
                                //Process shirtToDo
                                //Convert to CSV

                                shirtToDo.forEach(function (item, index) {
                                    //console.log('final '+item);
                                    request(item, function(error, response, body) {

                                            if (response.statusCode == 200) {
                                                /** Create jQuery like object */
                                                var $ = cheerio.load(body);

                                                /** Create json object to hold the shirt detail */
                                                var json = {};

                                                json.Title = $('title').text();
                                                json.Price = $('.price').text();
                                                json.ImageURL = $('.shirt-picture img').attr('src');
                                                json.URL = item;

                                                var date = new Date();
                                                json.Time = date; // Time of extraction

                                                /** Store shirt details into an array */
                                                data.push(json);



                                                /** Create csv file */
                                                if(shirtToDo.length===shirtArray.length-1){
                                                    var dd = date.getDate();
                                                    var mm = date.getMonth() + 1 ;
                                                    var yyyy = date.getFullYear();
                                                    var csvFileName = yyyy + "-" + dd + "-" + mm + ".csv";

                                                    /** Convert json data into csv format using node module json2csv */
                                                    json2csv({data: data, fields: csvFields}, function (err, csv) {

                                                        if (err) throw err;
                                                        /** If the data file for today already exists it should overwrite the file */
                                                        fs.writeFile(dir + "/" + csvFileName, csv, function (err) {
                                                            if (err) throw err;
                                                            console.log(csvFileName + ' created');
                                                        }); //End fo writeFile

                                                    }); // End of json2csv method
                                                }

                                            }else {
                                                printErrorMessage(error);

                                            }

                                    }); // End of request method

                                });


                        }else{
                            printErrorMessage(error);
                        }

                    });
                }
            });//shirtArray forEach

        }else {
            printErrorMessage(error);
        }



});
function printErrorMessage(error) {
    console.log('Error occured while scrapping site ' + url);
    var errorMsg = "[" + Date() + "]" + " : " + error + "\n";
    fs.appendFile(errorFile, errorMsg, function(err) {
        if (err) throw err;
        console.log('Error was logged into "error.log" file');
    });
}
