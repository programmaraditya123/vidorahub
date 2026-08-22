const { createCategorySelectEvent } = require("./CategorySelect.model")


const SelectedCategory = async (req,res) => {
    try {
        const event = await createCategorySelectEvent(req.body);
        return res.status(201).json({
            success: true,
        });
        
    } catch (error) {
        console.error(
            "Category selection event error:",
            error
        );

        return res.status(400).json({
            success: false,
            message: error.message
        });
        
    }
}

module.exports = {SelectedCategory}