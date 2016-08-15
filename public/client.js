var viewModel = {
        width: 100,
        height: 100,
        Calculate: function(event) 
        { 
            alert('Area = ' + this.width * this.height); 
        }
    };


BindModel(viewModel, '#el', '#template', null, null, true);


