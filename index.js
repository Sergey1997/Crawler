const puppeteer = require('puppeteer');
const ObjectsToCsv = require('objects-to-csv');

const config = {
    URL: "https://r.onliner.by/pk/apartments",

    propertyFields: {
        selectorsFields: {
            address: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-info > div:nth-child(4) > div > div.apartment-info__cell.apartment-info__cell_66 > div.apartment-info__sub-line.apartment-info__sub-line_large",
            price: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-bar > div > div.apartment-bar__part.apartment-bar__part_66 > div.apartment-bar__item.apartment-bar__item_price > span.apartment-bar__price.apartment-bar__price_secondary > span",
            rooms: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-bar > div > div.apartment-bar__part.apartment-bar__part_66 > div:nth-child(2) > span",
            floor: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-info > div:nth-child(1) > div > div.apartment-info__cell.apartment-info__cell_66 > div:nth-child(1) > table > tbody > tr:nth-child(1) > td.apartment-options-table__cell.apartment-options-table__cell_right",
            fullSqft: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-info > div:nth-child(1) > div > div.apartment-info__cell.apartment-info__cell_66 > div:nth-child(1) > table > tbody > tr:nth-child(2) > td.apartment-options-table__cell.apartment-options-table__cell_right",
            kitchenSqft: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-info > div:nth-child(1) > div > div.apartment-info__cell.apartment-info__cell_66 > div:nth-child(1) > table > tbody > tr:nth-child(4) > td.apartment-options-table__cell.apartment-options-table__cell_right",
            type: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-info > div:nth-child(1) > div > div.apartment-info__cell.apartment-info__cell_66 > div.apartment-info__column.apartment-info__column_50.apartment-info__column_shifted > ul > li:nth-child(1)",
            wallsMaterial: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-info > div:nth-child(1) > div > div.apartment-info__cell.apartment-info__cell_66 > div.apartment-info__column.apartment-info__column_50.apartment-info__column_shifted > ul > li:nth-child(2)",
            balcony: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-info > div:nth-child(1) > div > div.apartment-info__cell.apartment-info__cell_66 > div.apartment-info__column.apartment-info__column_50.apartment-info__column_shifted > ul > li:nth-child(3)",
            parking: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-info > div:nth-child(1) > div > div.apartment-info__cell.apartment-info__cell_66 > div.apartment-info__column.apartment-info__column_50.apartment-info__column_shifted > ul > li:nth-child(4)",
            ceiling: "#container > div > div.l-gradient-wrapper > div > div > div.arenda-apartment > div.apartment-info > div:nth-child(1) > div > div.apartment-info__cell.apartment-info__cell_66 > div.apartment-info__column.apartment-info__column_50.apartment-info__column_shifted > ul > li:nth-child(5)"
        }
    }
};

const innerText = async (element) => {
    return await (await element.getProperty('innerText')).jsonValue();
}

const getElementWithInnerText = async (elemets, txtToFind) => {
    for (const element of elemets) {
        const txt = await innerText(element);
        if (txt && txt === txtToFind)
            return element;
    }
};


const parseProperty = async (page, config) => {
    const property = {};

    for (const key in config.selectorsFields) {
        console.log(key);
        property[key] = null;

        try {
            const selector = config.selectorsFields[key];
            const field = (await page.$(selector));
            const text = await innerText(field);
            property[key] = text;
        } catch (e) {
            //console.log(`An error occured with field ${key}`);
        }
    }

    if(property.address == null){
        return null;
    }

    return property;
}

(async () => {
    console.log("start");
    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();

    await page.goto(config.URL, {
        waitUntil: 'load',
        timeout: 0
    });


    var properties = [];
    const maxRetries = 2;
    let error = false;

    const fileNamePostFix = Date.now();

    let num = 400197;

    do {
        console.log(`page num ${num}`);
        await page.goto(config.URL + "/" + num);
        let tryNum = 1;
        try {

            const property = await parseProperty(page, config.propertyFields);
            if (!!property) {
                properties.push(property);
                console.log(properties.length);
            }
        }
        catch (e) {
            console.log(e);
            error = true;
        }
        num++;
        tryNum++;
    } while ((error && tryNum <= maxRetries) || num < 410000)

    if (properties.length > 0) {
        const csv = new ObjectsToCsv(properties);
        await csv.toDisk(`./properties_${fileNamePostFix}.csv`, { append: true, bom: true });
    }

})();