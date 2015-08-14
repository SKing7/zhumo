'use strict';

/**
 * Module dependencies.
 */
var should = require('should'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    Company = mongoose.model('Company'),
    Category = mongoose.model('Category');

/**
 * Globals
 */
var user, category, child, company;

/**
 * Unit tests
 */
describe('Category Model:', function () {
    beforeEach(function (done) {
        user = new User({
            email: 'test@test.com',
            password: 'password'
        });

        company = new Company({
            name: '朱墨科技',
            owner: user,
        });

        user.save(function () {
            company.save(function () {
                category = new Category({
                    name: 'parent',
                    company: company,
                    createdBy: user
                });

                child = new Category({
                    name: 'child',
                    company: company,
                    createdBy: user
                });

                done();
            });
        });
    });

    describe('new category', function () {
        it('should be able to save without problems', function (done) {
            return category.save(function (err) {
                should.not.exist(err);

                should(category).have.property('name');
                should(category).have.property('createdBy');
                should(category).have.property('company');
                should(category).have.property('gmtCreated');

                should.equal(category.name, 'parent');
                should.equal(category.parentId, null);

                done();
            });
        });

        it('should be able to show an error when try to save without name', function (done) {
            category.name = '';

            return category.save(function (err) {
                should.exist(err);
                done();
            });
        });

        it('should be able to show an error when try to save without createdBy', function (done) {
            category.createdBy = '';

            return category.save(function (err) {
                should.exist(err);
                done();
            });
        });

        it('should be able to show an error when try to save without company', function (done) {
            category.company = '';

            return category.save(function (err) {
                should.exist(err);
                done();
            });
        });
    });

    describe('new child', function () {
        it('should Category.addChild work as expected: parentId, plain child object', function (done) {
            category.save(function (err, parent) {
                Category.addChild(parent._id, child, function(err, child) {
                    should.not.exist(err);

                    should(child).have.property('name');
                    should(child).have.property('createdBy');
                    should(child).have.property('company');
                    should(child).have.property('gmtCreated');

                    should(child).have.property('parentId');

                    should.equal(child.name, 'child');
                    should.equal(child.parentId.toString(), parent._id.toString());

                    var child2 = {
                        name: 'child2',
                        company: company,
                        createdBy: user
                    };

                    parent.addChild(child2, function (err, child2) {
                        should.equal(child2.name, 'child2');
                        should.equal(child2.parentId.toString(), parent._id.toString());

                        parent.children(function (err, children) {
                            should.equal(children.length, 2);
                            children.forEach(function (child) {
                                should.equal(child.parentId.toString(), parent._id.toString());
                            });
                            done();
                        });
                    });

                });
            });
        });

        it('should Category.addChild work as expected: parent instance and child instance', function (done) {
            category.save(function (err, parent) {
                parent.addChild(child, function(err, child) {
                    should.not.exist(err);

                    should(child).have.property('name');
                    should(child).have.property('createdBy');
                    should(child).have.property('company');
                    should(child).have.property('gmtCreated');

                    should(child).have.property('parentId');

                    should.equal(child.name, 'child');
                    should.equal(child.parentId.toString(), parent._id.toString());

                    var child2 = new Category({
                        name: 'child2',
                        company: company,
                        createdBy: user
                    });

                    parent.addChild(child2, function (err, child2) {
                        should.equal(child2.name, 'child2');
                        should.equal(child2.parentId.toString(), parent._id.toString());

                        parent.children(function (err, children) {
                            should.equal(children.length, 2);
                            children.forEach(function (child) {
                                should.equal(child.parentId.toString(), parent._id.toString());
                            });
                            done();
                        });
                    });

                });
            });
        });
    });

    describe('add defaults', function () {
        it('should Category.addDefaults work as expected', function (done) {
            Category.addDefaults(company, user, function(err) {
                should.not.exist(err);
                Category.getTreeByCompany(company, function (err, categories) {
                    should.not.exist(err);
                    categories.forEach(function (category) {
                        should(category).have.property('childNodes');
                    });
                    done();
                });
            });
        });
    });

    afterEach(function (done) {
        Category.remove().exec();
        Company.remove().exec();
        User.remove().exec();
        done();
    });

});
