//Request
const request = require("request");
// RequestPromise
const requestPromise = require("request-promise");
// Cheerio $
const cheerio = require("cheerio");
//File system
const fs = require("fs");
// Json2csv
const { Parser } = require("json2csv");
// Colors
const colors = require("colors");

// Empty array declaration
let empresasArray = [];
let paginationArray = [];
let resultsObject = [];

//Autoexcutable annonimous function
(async () => {
  //Try block
  try {
    let response = await requestPromise(
      "https://chileservicios.com/industrias/tecnologias-de-la-informacion/"
    );
    let $ = cheerio.load(response);
    // PAGINATION LAST PAGE NUMBER
    let PAGENUMBER = parseInt(
      $("ul.pagination > li").last().prev().find("a").text()
    );

    // POBLAR ARRAY DE LINKS
    for (let i = 1; i < PAGENUMBER + 1; i++) {
      if (paginationArray.length === 0) {
        paginationArray.push(
          `https://chileservicios.com/industrias/tecnologias-de-la-informacion/`
        );
      } else {
        paginationArray.push(
          `https://chileservicios.com/industrias/tecnologias-de-la-informacion/page/${i}/`
        );
      }
    }

    console.log(
      `Pagination ARRAY has ${paginationArray.length} LINKS to scrape`.bgGreen
        .black
    );

    // HTTP REQUEST TO PAGINATION TO GET EACH ITEM'S LINK
    for (let url of paginationArray) {
      response = await requestPromise(url);
      $ = await cheerio.load(response);
      $('div[class="card-body"] > a').each(function () {
        console.log($(this).attr("href"));
        empresasArray.push($(this).attr("href"));
      });
    }
    console.log(
      `Empresas ARRAY has ${empresasArray.length} LINKS to scrape`.yellow
    );

    // SCRAPE ALL THE DATA
    for (let url of empresasArray) {
      response = await requestPromise(url);
      $ = await cheerio.load(response);
      let title = $('div[class="card-header"] > h1').text();
      let description = $(
        "#page > div > div > div.col-lg-8.my-2 > div > div.card-body > div > div.col-md-8.my-2"
      )
        .text()
        .trim();
      let phone = $(
        "#page > div > div > div.col-lg-4.my-2 > div > div > p:nth-child(2)"
      )
        .text()
        .replace(/\s/g, "");
      let email = $(
        "#page > div > div > div.col-lg-4.my-2 > div > div > p:nth-child(3)"
      )
        .text()
        .trim();
      let webpage = $(
        "#page > div > div > div.col-lg-4.my-2 > div > div > p:nth-child(4)"
      )
        .text()
        .trim();
      //Push elements to an JSON
      resultsObject.push({
        titulo: title,
        telefono: phone,
        correo: email,
        pagina: webpage,
        descripcion: description,
      });
      // CREATE JSONFILE
      let data = JSON.stringify(resultsObject);
      fs.writeFileSync("resultsObject.json", data);
      console.log(`Item scraped ✅`.green);
    }
    console.log("Scrapped Successfull".bgGreen.black);
    const fields = ["titulo", "telefono", "correo", "pagina", "descripcion"];

    // I SPECIFY THE FIELDS THAT I NEED
    const json2csvParser = new Parser({
      fields: fields, // I SPECIFY THE FIELDS THAT I NEED
      // quote: "", // I ELIMINATE THE QUOTES FORM THE FIELDS
      // delimiter: '"', // I CHANGE THE DELIMITER FROM , WHICH IS DEFAULT TO "
      defaultValue: "No info", // THIS IS THE DEFAULT VALUE WHEN THERE IS NO INFO IN THE FIELD
    });

    const csv = json2csvParser.parse(resultsObject);
    // const ramdom = Math.floor(Math.random() * (1000000 - 100)) + 100;
    fs.writeFileSync(`./results/results.csv`, csv, "utf-8");
    console.log("Done JSON to CSV...".bgGreen.black);
  } catch (err) {
    console.error(err);
  }
})();
