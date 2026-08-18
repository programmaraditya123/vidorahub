// CategorySelect.Model.js

const db = require("../../config/db2");
const validateCategorySelectEvent =
    require("./CategorySelect.Schema");

const categorySelectCollection = db.collection("category_select_events");


const createCategorySelectEvent = async (data) => {

    const document =
        validateCategorySelectEvent(data);

    return categorySelectCollection.insertOne(
        document
    );
};

module.exports = {
    createCategorySelectEvent
};