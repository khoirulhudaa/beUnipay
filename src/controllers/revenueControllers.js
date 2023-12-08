const revenueModel = require('../models/requestModel')

const getRevenueById = async (req, res) => {
    try {

        const { revenue_id } = req.params

        const revenue = await revenueModel.findOne({ revenue_id })
        if(revenue === 0) return res.json({ status: 404, message: 'Revenue not found!' })
        
        return res.json({ status: 200, message: 'Successfully get revenue!', data: revenue })

    } catch (error) {
        return res.json({ status: 500, message: 'Error server!', error: error.message })
    }
}

module.exports = {
    getRevenueById
}