const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const fileHelper = require('../util/file');

const {validationResult} = require('express-validator');

const Product = require('../models/product');

const { validationError } = require('sequelize');

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
           pageTitle: 'Add-Product', 
           path: '/admin/add-product',
           editing: false,
           hasError: false,
           errorMessage: null,
           validationErrors: [] 
       });
    };

exports.postAddProduct = (req, res, next) => {

  console.log('📦 POST /admin/add-product hit');

  if (!req.user) {
    console.log('❌ req.user is missing');
    return res.redirect('/login');
  }

  const imageL = req.file;
  console.log("📷 Received image:", imageL);

  const error = validationResult(req);
  console.log("🔍 Validation errors:", error.array());


  const title = req.body.title;
  const price = parseFloat(req.body.price);
  const image = req.file;
  const description = req.body.description;

  // 🛑 If image is missing (wrong type or not uploaded)
  if (!image) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: 'Attached file is not an image',
      validationErrors: []
    });
  }
  
  const imageUrl = path.join('images', image.filename).replace(/\\/g, '/');


  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description
      },
      errorMessage: errors.array()[0].msg,
      validationErrors: errors.array()
    });
  }

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user._id
  });

  product
    .save()
    .then(result => {
      console.log('✅ Product created successfully!');
      res.redirect('/admin/products');
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
    Product.find({ userId: req.user._id })
    // .select('title price - _id')
    // .populate('userId', 'name')
    .then(products => {
        console.log(products);
        res.render('admin/products', {
            prods: products,
            pageTitle: 'Admin Products',
            path: '/admin/products'
       });
    })
    .catch(err => {
    const error = new Error(err);
    error.httpStatusCode =  500;
    return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
        const editMode = req.query.edit === 'true';
        if(!editMode) {
            return res.redirect('/');
        }
        const prodId = req.params.productId; 
        Product.findById(prodId)
        .then(product => { 
        if (!product) {
        return res.redirect('/');
        }
        res.render('admin/edit-product', {
        pageTitle: 'Edit Product', 
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        hasError: false,
        errorMessage: null,
        validationErrors: []
    });
})
        .catch(err => {
            const error = new Error(err);
            error.httpStatusCode =  500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    console.log("Editing Product ID:", prodId);

    // If prodId is mistakenly passed as an array (e.g. ['123', '123']), fix it
    if (Array.isArray(prodId)) {
        prodId = prodId[0];
    }

    if (!prodId || typeof prodId !== 'string' || prodId.trim().length === 0) {
        console.log('Invalid productId:', prodId);
        return res.status(400).send('Invalid product ID');
    }
    
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const image = req.file;
    const updatedDescription = req.body.description;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
        pageTitle: 'Edit Product', 
        path: '/admin/edit-product',
        editing: true,
        hasError: true,
        product: {
            title: updatedtitle,
            price: updatedprice,
            description: updateddescription,
            _id: prodId
        },
        errorMessage: errors.array()[0].msg,
        validationErrors: errors.array()
    });
    }

    Product.findById(prodId)
    .then(product => {
        if (product.userId.toString() !== req.user._id.toString()) {
            return res.redirect('/');
        }
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.description = updatedDescription;
        if (image) {
         fileHelper.deleteFile(product.imageUrl); 
         product.imageUrl = image.path;
        }
        return product.save()
        .then(result => {
            console.log('UPDATED PRODUCT');
            res.redirect('/admin/products');
        });
    })
        .catch(err => {
    const error = new Error(err);
    error.httpStatusCode =  500;
    return next(error);
   });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      if (!product) {
        return next(new Error('Product not found!'));
      }

      fileHelper.deleteFile(product.imageUrl); // ✅ Proper file deletion
      return Product.deleteOne({ _id: prodId, userId: req.user._id });
    })
    .then(() => {
      console.log('✅ DESTROYED PRODUCT');
      res.status(200).json({ message: 'Success!' });
    })
    .catch(err => {
      res.status(500).json({ message: 'Deleting product failed!' });
    });
};