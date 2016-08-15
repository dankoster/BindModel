//
//This function sets up two-way binding of a viewModel to a view/template
// Requires a reference to ractive.js (http://cdn.ractivejs.org/latest/ractive.js)
//
function BindModel(viewModel, el, template, partialTemplateName, partialTemplate, debugOutput)
{
    if(debugOutput) console.log('BindModel to element: ' + el);
    if(debugOutput) console.log('Binding template: ' + template);
 
    //set up a ractive instance for the model we're binding
    var ractive;
    if (partialTemplateName !== null) {
        ractive = new Ractive({
            el: el,
            template: template,
            partials: { 'Regions': partialTemplate }, // TODO: make this dynamic
            data: viewModel
        });
    }
    else {
        ractive = new Ractive({
            el: el,
            template: template,
            data: viewModel
        });
    }
 
    //Replace a specified property with a new property that ALSO calls a callback function
    var Observe = function (viewModel, property, propertyChangedHandler, parents)
    {
        var callingHandler = false;
        var oldval = viewModel[property];
        var value = oldval;
        var getter = function ()
        {
            return value;
        }
        var setter = function (newval)
        {
            oldval = value;
            value = newval;
 
            //call the propertyChangedHandler, but prevent recursion!
            if (!callingHandler)
            {
                callingHandler = true;
                propertyChangedHandler.call(this, parents, property, oldval, newval);
                callingHandler = false;
            }
        }
 
        //replace the property with a new one that also calls the propertyChangedHandler
        if (delete viewModel[property]) // can't delete constants
        {
            Object.defineProperty(viewModel, property, {
                get: getter,
                set: setter,
                enumerable: true,
                configurable: true
            });
 
            //if(debugOutput) console.log('Observing:' + property);
        }
    }
 
    var OnPropertyChanged = function (parents, propertyName, oldVal, newVal)
    {
        if(debugOutput) console.log("OnPropertyChanged(" + parents +propertyName + ') ' + oldVal + ' --> ' +newVal);
        ractive.set(parents + propertyName, newVal);
    }
 
    //set up an observer for each property of the viewModel
    var ObserveProperties = function (viewModel, propertyParents)
    {
        if (!propertyParents)
            propertyParents = [];
 
        for (var property in viewModel)
        {
            if (typeof viewModel[property] !== 'function')
            {
                var parents = propertyParents.length > 0 ? propertyParents.join('.') + '.': '';
                if(typeof viewModel[property]=== 'object')
                {
                    Observe(viewModel, property, OnPropertyChanged, parents);
 
                    propertyParents.push(property);
                    ObserveProperties(viewModel[property], propertyParents);
                    propertyParents.pop();
                }
                else
                {
                    if(debugOutput) console.log("Observe Property: " + typeof viewModel[property]+ ' ' +parents +property);
 
                    Observe(viewModel, property, OnPropertyChanged, parents);
                }
            }
        }
    }
 
    var ObserveHandlers = function (template, viewModel)
    {
        template.forEach(function (templateItem) {
            if (typeof (templateItem) == 'object') {
 
                var nestedTemplate = templateItem['f']
                if (nestedTemplate && typeof (nestedTemplate) === 'object') {
                    ObserveHandlers(nestedTemplate, viewModel);
                }
 
                //get each of the "on-" properties like "on-click"
                var onHandlers = templateItem['v'];
                for (var handler in onHandlers) {
 
                    //if the value of the handler matches the name of a function in the view model 
                    var functionTarget = onHandlers[handler];
                    if (viewModel[functionTarget] && typeof (viewModel[functionTarget]) === 'function') {
 
                        //bind to the function in the view model
                        if(debugOutput) console.log("Observe Handler: " + functionTarget);
                        ractive.on(functionTarget, function (eventArgs) {
                            if(debugOutput) console.log("OnHandler(" + functionTarget + ') ');
                            viewModel[functionTarget].apply(viewModel, [eventArgs]); 
                        });
                    }
                    else {
                        if(debugOutput) console.log('WARNING! View model contains no function for the requested ' +handler + ' handler: ' +functionTarget);
                    }
                }
            }
        });
 
    }
 
    //start the recursive functions to bind properties and handlers
    ObserveProperties(viewModel);
    ObserveHandlers(ractive.template, viewModel);
 
    return ractive;
}