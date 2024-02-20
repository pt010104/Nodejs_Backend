"use strict"
const {discount} = require("../models/discount.model")
const {BadRequestError} = require("../core/error.response")
const { findAllProducts } = require("../models/repositories/products.repo")

class DiscountService {

    static createDiscount = async(payload) => {
        const {name, description, type, value, code, start_date, 
            end_date, max_uses, uses_count, users_used, max_uses_per_user, 
            min_order_value, shopId, max_value, is_active, applies_to, product_ids} = payload

        if (new Date() < new Date(start_date) || new Date() > new Date(end_date)) {
            throw new BadRequestError("The code has expired")
        }
        if (new Date(start_date) >= new Date(end_date)) {
            throw new BadRequestError("The start date must be before the end date")
        }

        const foundDiscount = discount.findOne({
            where: {
                discount_code: code,
                discount_shopId: shopId,
                discount_is_active: true
            }
        })

        if(foundDiscount) {
            throw new BadRequestError("The code has been used")
        }

        const newDiscount = discount.create({
            discount_name: name,
            discount_description: description,
            discount_type: type,
            discount_value: value,
            discount_code: code,
            discount_start_date: new Date (start_date),
            discount_end_date: new Date (end_date),
            discount_max_uses: max_uses,
            discount_uses_count: uses_count,
            discount_users_used: users_used,
            discount_max_uses_per_user: max_uses_per_user,
            discount_min_order_value: min_order_value || 1,
            discount_shopId: shopId,
            discount_max_value: max_value,
            discount_is_active: is_active,
            discount_applies_to: applies_to 
        })

        return newDiscount
    }

    static updateDiscount = async(id, payload) => {

    }

    static getAllProductsOfDiscount = async(payload) => {

        const {code, shopId} = payload
        const foundDiscount = discount.findOne({
            where: {
                discount_code: code,
                discount_shopId: shopId,
                discount_is_active: true
            }
        })
        if(!foundDiscount) {
            throw new BadRequestError("The code is invalid")
        }

        const {discount_applies_to, discount_product_ids} = foundDiscount
        let products

        if(discount_applies_to === "all") {
            products = await findAllProducts({
                limit: 50,
                page: 1,
                sort: "ctime",
                filter: {
                    isPublished: true,
                    product_shop: shopId
                },
                select: ["product_name", "product_thumb", "product_price"]
            })
        }
        if(discount_applies_to === "specific") {
            products = await findAllProducts({
                limit: 50,
                page: 1,
                sort: "ctime",
                filter: {
                    isPublished: true,
                    product_shop: shopId,
                    id: discount_product_ids
                },
                select: ["product_name", "product_thumb", "product_price"]
            })
        }

        return products

    }

    static getALlDiscountOfShop = async({limit = 50, page = 1, shopId }) => {
        const skip = (page - 1) * limit
        const discounts = discount.findAll({
            where: {
                discount_shopId: shopId
            },
            attributes:
            {
                exclude: ["discount_shopId"]
            },
            limit: limit,
            skip: skip,
            order: [
                ["discount_end_date", "DESC"]
            ]
        })

        return discounts
    }



}


module.exports = DiscountService