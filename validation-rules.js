(function () {
    "use strict";

    const __$$customRules = Symbol('customRules');
    const __$$currentErrorRule = Symbol('currentErrorRule');
    const __$$dirtyError = Symbol('dirtyError');

    const wait = Promise.resolve();

    const barredTypes = {
        image: true,
        submit: true,
        reset: true,
        button: true
    };

    const submitterTypes = {
        image: true,
        submit: true
    };

    function addCustomValidation(element, rule){
        let type;

        if (!(type = element.type) || barredTypes[type]) {
            return;
        }

        const customRules = getRules(element);

        customRules.push(rule);

        if (!element.validity.customError) {
            runRule(element, element.value, rule);
        }
    }

    function removeCustomValidation(element, rule) {
        const rules = element[__$$customRules];

        if (rules) {
            rules.splice(rules.indexOf(rule), 1);

            if (rule === this[__$$currentErrorRule]) {
                this[__$$currentErrorRule] = null;
                this.setCustomValidity('');
                runRules(this);
            }
        }
    }


    function runRule(element, value, rule) {
        const message = rule.call(element, value) || '';

        element.setCustomValidity(message);

        if (message) {
            element[__$$currentErrorRule] = rule;
        } else if(element[__$$currentErrorRule] == rule){
            element[__$$currentErrorRule] = null;
        }

        return message;
    }

    function runRules(element) {
        let i, len, value;
        const rules = element[__$$customRules];
        const currentSuffer = element[__$$currentErrorRule];


        if (rules) {
            value = element.value;

            if (!element.validity.customError || (currentSuffer && !runRule(element, value, currentSuffer))) {
                for (i = 0, len = rules.length; i < len; i++) {
                    if (currentSuffer !== rules[i] && runRule(element, value, rules[i])) {
                        break;
                    }
                }
            }

            element[__$$dirtyError] = false;
        }
    }

    function getRules(element) {
        let rules = element[__$$customRules];

        if (!rules) {
            rules = [];
            element[__$$customRules] = rules;
            element[__$$currentErrorRule] = null;
            element[__$$dirtyError] = false;
        }
        return rules;
    }

    Object.defineProperties(HTMLFormElement.prototype, {
        requestCustomValidation: {
            value: function () {
                let i, len;
                const elements = this.elements;

                for (i = 0, len = elements.length; i < len; i++) {
                    if(elements[i].requestCustomValidation){
                        elements[i].requestCustomValidation();
                    }
                }
            },
            writable: true,
            configurable: true,
            enumerable: true
        }
    });

    [HTMLInputElement.prototype, HTMLSelectElement.prototype, HTMLTextAreaElement.prototype].forEach((element)=>{

        Object.defineProperties(element, {
            requestCustomValidation: {
                value: function(){
                    return runRules(this);
                },
                writable: true,
                configurable: true,
                enumerable: true
            },
            addCustomValidation: {
                value: function(rule){
                    return addCustomValidation(this, rule);
                },
                writable: true,
                configurable: true,
                enumerable: true
            },
            removeCustomValidation: {
                value: function(rule){
                    return removeCustomValidation(this, rule);
                },
                writable: true,
                configurable: true,
                enumerable: true
            },
        });
    });

    [HTMLFieldSetElement.prototype, HTMLButtonElement.prototype].forEach((element)=>{
        const noop = ()=> {};

        Object.defineProperties(element, {
            requestCustomValidation: {
                value: noop,
                writable: true,
                configurable: true,
                enumerable: true
            },
            addCustomValidation: {
                value: noop,
                writable: true,
                configurable: true,
                enumerable: true
            },
            removeCustomValidation: {
                value: noop,
                writable: true,
                configurable: true,
                enumerable: true
            },
        });
    });


    [HTMLFormElement.prototype, HTMLInputElement.prototype, HTMLSelectElement.prototype, HTMLTextAreaElement.prototype].forEach(function (element) {
        ['checkValidity', 'reportValidity'].forEach(function (fnName) {
            const desc = Object.getOwnPropertyDescriptor(element, fnName);

            if (desc && desc.writable && desc.value && desc.value.apply) {
                element[fnName] = function () {
                    this.requestCustomValidation();
                    return desc.value.apply(this, arguments);
                };
            }
        });
    });

    [HTMLInputElement.prototype, HTMLSelectElement.prototype, HTMLTextAreaElement.prototype, HTMLOptionElement.prototype].forEach(function (element) {
        const isOptionElement = HTMLOptionElement.prototype == element;

        ['value', 'selected', 'selectedIndex'].forEach(function (fnName) {
            const desc = Object.getOwnPropertyDescriptor(element, fnName);

            if (desc && desc.configurable && desc.set && desc.set.apply) {
                Object.defineProperty(element, fnName, {
                    set: function () {
                        const element = isOptionElement ? this.closest('select') : this;
                        const rules = element && element[__$$customRules];

                        if (rules && !element[__$$dirtyError]) {
                            element[__$$dirtyError] = true;

                            wait.then(function () {
                                if(element[__$$dirtyError]){
                                    runRules(element);
                                }
                            });
                        }

                        return desc.set.apply(this, arguments);
                    },
                    configurable: true,
                    enumerable: true
                });
            }
        });
    });

    window.addEventListener('click', function (e) {
        let form;

        if (submitterTypes[e.target.type] && (form = e.target.form) && form.requestCustomValidation) {
            form.requestCustomValidation();
        }
    }, true);

    window.addEventListener('reset', function (e) {
        const form = e.target;

        if (form.requestCustomValidation) {
            wait.then(() => {
                if (!e.defaultPrevented) {
                    form.requestCustomValidation();
                }
            });

        }
    }, true);

    window.addEventListener('change', function (e) {
        if(e.target.requestCustomValidation){
            e.target.requestCustomValidation();
        }
    }, true);
})();
