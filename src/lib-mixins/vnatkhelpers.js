import Vue from "vue";

import _ from "lodash";

export default {
    methods: {
        checkOptions: function (options) {
            var err = [];
            // check for mandatory options
            if (!options.model) err.push('"model" option not defined in crud options');
            if (!options.tableoptions) err.push('"tableoptions" option not defined in crud options');

            if (err.length) return err;
            // put default mendatory options
            if (!options.basepath) options.basepath = '/crud';
            return true;
        },

        filterOptionsForServer: function (options) {
            var opt = Object.assign({}, options);
            if (opt.actionsoverrides) delete opt.actionsoverrides;
            if (opt.tableoptions !== undefined && opt.tableoptions.headersoverrides !== undefined) delete opt.tableoptions.headeroverrides;

            return opt;
        },

        handleHeaderOverrides(serverheaders, overrideheaders) {
            if (!overrideheaders) return serverheaders;
            var finalHeaders = [...serverheaders];

            for (const [field, overrideObj] of Object.entries(overrideheaders)) {
                const i = finalHeaders.findIndex((p) => p.value === field);
                if (_.has(overrideObj, 'hide')) {
                    // look for hide
                    finalHeaders.splice(i, 1);
                } else if (i > -1) {
                    // look for override
                    finalHeaders[i] = Object.assign(finalHeaders[i], overrideObj);
                } else {
                    // add new header field
                    finalHeaders.push(overrideObj)
                }
                if (_.has(overrideObj, 'moveto')) {
                    var moveto = overrideObj.moveto;
                    if (moveto == -1) moveto = finalHeaders.length;
                    finalHeaders.splice(moveto, 0, finalHeaders.splice(i, 1)[0]);
                }
            }
            return finalHeaders;
        },

        handleActionsOverrides(serveractions, overrideactions) {
            if (!overrideactions) return serveractions;
            var finalActions = [...serveractions];

            for (let index = 0; index < overrideactions.length; index++) {
                const to_update = overrideactions[index];
                const i = finalActions.findIndex((p) => p.name === to_update.name);
                if (i > -1) {
                    // Action found in server action list, override this now
                    var thisFinalAction = finalActions[i];

                    // if this finalActions has formschema and overrideactions also has formschema
                    // replace overrided schema in finalActions
                    // remove formschema in overrideactions
                    if (_.has(thisFinalAction, 'formschema') && _.has(to_update, 'formschema')) {
                        finalActions[i].formschema = Object.assign({}, to_update.formschema);
                        delete to_update.formschema;
                    }

                    // if finalActions has formschema and overrideactions has formschemaoverrides
                    // merge formschemaoverrides over formschema in finalAction
                    // remove formschemaoverrides in overrideactions
                    if (_.has(thisFinalAction, 'formschema') && _.has(to_update, 'formschemaoverrides')) {
                        for (const [field, overrideObj] of Object.entries(to_update.formschemaoverrides)) {
                            Object.assign(finalActions[i].formschema[field], overrideObj);
                        }
                        delete to_update.formschemaoverrides
                    }
                    // check if this needs position change
                    // or merge overrideaction over this finalAction
                    finalActions[i] = Object.assign(finalActions[i], to_update);
                } else {
                    // action not found from server list, add new action from user
                    finalActions.push(to_update);
                }
            }
            return finalActions;
        },

        findActionFormSchemabySearchInputValue(action, val) {
            if (!_.has(action, "formschema")) return;
            for (const [field, schema] of Object.entries(action.formschema)) {
                if (schema.searchInput == val) return action.formschema[field];
            }
            return false;
        },

        getAutoCompleteServiceOptions(schema, q, serveroptions) {
            // create service option from schema association info
            // override user defined values
            if (!q) return;
            var overrideserviceoption = {};
            if (_.has(schema, 'serviceoptions')) overrideserviceoption = schema.serviceoptions;
            var serviceoptions = {};
            serviceoptions.service = overrideserviceoption.service ? overrideserviceoption.service : serveroptions.service;
            serviceoptions.basepath = overrideserviceoption.basepath ? overrideserviceoption.basepath : serveroptions.basepath;
            serviceoptions.model = overrideserviceoption.model ? overrideserviceoption.model : schema.association.name.singular;
            serviceoptions.modeloptions = {};
            serviceoptions.modeloptions['where'] = {};
            serviceoptions.modeloptions['attributes'] = overrideserviceoption.modelattributes ? overrideserviceoption.modelattributes : ["id", "name"];
            serviceoptions.modeloptions['where'][overrideserviceoption.searchfield ? overrideserviceoption.searchfield : 'name'] = { $like: "%" + q + "%" };
            serviceoptions.modeloptions['limit'] = overrideserviceoption.limit ? overrideserviceoption.limit : 10;
            return serviceoptions;

        }
    }
}