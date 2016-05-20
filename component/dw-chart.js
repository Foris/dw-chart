
// dwChart
(function( $ ){
  "use strict"

  var scripts = document.getElementsByTagName("script");
  var urlBase = scripts[scripts.length-1].src;
  urlBase = urlBase.replace('dw-chart.js', '');

  let updateData;

  // Public methods
  let api = {
    init : function(options) {
      const $el = $(this);
      // if exist a chart with the same name just update
      if($el.hasClass('dw-chart')){
        // update
        methods.updateComponent($el, options);
      }else{
        // new
        methods.newComponent($el, options);
      }
    },
    destroy: function(){
      const $el = $(this);
      $el.empty();
      $el.removeClass('dw-chart');
    },
    val: function($el){
      (typeof $el === 'undefined' || $el === null ) ? $el = $(this) : null;
      methods.getVal($el);
    }
  }

  // Private methods
  let methods = {

    newComponent: function($el, options){
      // deploy component structure
      let deployment = new Promise(function(resolve, reject){
        methods.deployComponent($el, options);
        resolve();
      })
      deployment.then(function(){
        methods.getTemplate($el, options);
      })
    },

    updateComponent: function($el, options){
      // set that is a update data
      updateData = true;
      // take data objects and updatebar
      let data = options['data'];

      // update depend of type
      switch(options.type){
        case 'bar':
          // options each
          data.forEach(function (data, i) {
            let itemId = data['title'].replace(' ','');
            // hide legends
            $el.find('.legend').fadeOut("slow");
            // set bar length
            let $item = $el.find('li[data-id="' + itemId + '"]');
            let number = data['number'].toFixed(options['decimals']);
            methods.updateBar($item.find('.bar'),number, options['unit']);
          });
          break;
        case 'barpie':
          // hide numbers
          let legends = $el.find('> content > .chart > .bottom > li > span > .legend');
          legends.fadeOut("slow");
          // calculate total sum of numbers
          let sum = 0;
          data.forEach(function (dat, i) {
            sum = sum + dat['number'];
            // change text
            $el.find('> content > .chart > .bottom > li:eq(' + i + ') > span > .legend').text(dat['number']);
          });
          // update width
          methods.updateBarpie($el, sum);
          // set height
          let barHeight = $el.find('> content > .chart > .bottom > li:first-child').outerHeight();
          $el.find('> content > .chart > .bottom').css({
            height: barHeight + 13 + 'px'
          })
          // show legends
          legends.delay(1500).fadeIn('slow');
          $el.find('> content > .chart > .bottom > li > .legend').delay(1500).fadeIn('slow');
          break;
      }

      // updateData = false;
    },

    deployComponent: function($el, options){
      $el.addClass('dw-chart');
    },

    getTemplate: function($el, options){

      $.get(urlBase + "templates/dw-chart.html", function( result ) {
        let templateContent = result;
        methods.setTemplate($el, templateContent, options)
      });

    },

    setTemplate : function($el, templateContent, options){

      let template = _.template(templateContent);
      $el.html( template({
        id: options['name'],
        title: options['title'],
        type: options.type
      }) );

      if (typeof options !== 'undefined') {
        methods.itemTemplate($el, options)
      }
    },
    itemTemplate: function($el, options){

      switch(options.type){
        case 'bar':
          methods.barTemplate($el, options);
          break;
        case 'barpie':
          methods.barpieTemplate($el, options);
          break;
      }
    },
    barTemplate: function($el, options, update){
      // orientation
      let orientation = options['orientation'];
      // put items
      let template = 'templates/bar-item.html';

      $.get(urlBase + template, function( result ) {
        let template = _.template(result);
        let data = options['data'];

        // options each
        data.forEach(function (data, i) {
          let itemId = data['title'].replace(' ','');
          let contentHtml = template({
            id: itemId,
            title: data['title'],
            number: data['number'],
            unit: options.unit,
            decimals: options.decimals,
            emphasis: options.emphasis
          });
          // paint it
          $el.find('content > .chart > .bottom').append(contentHtml);
          // set bar length
          let $item = $el.find('li[data-id="' + itemId + '"]');
          methods.updateBar($item.find('.bar'), data['number'], options['unit']);
        });
      });
    },
    barpieTemplate: function($el, options){
      let datas = options['data'];
      // orientation
      let orientation = options['orientation'];
      // put items
      let template = 'templates/barpie-item.html';

      $.get(urlBase + template, function( result ) {
        let template = _.template(result);

        // options each
        datas.forEach(function (data, i) {
          let itemId = data['title'].replace(' ','');
          let contentHtml = template({
            id: itemId,
            title: data['title'],
            number: data['number'],
            unit: options.unit,
            decimals: options.decimals,
            emphasis: options.emphasis
          });
          // paint it
          $el.find('content > .chart > .bottom').append(contentHtml);
          // set bar length
          let $item = $el.find('li[data-id="' + itemId + '"]');

          methods.initBarpie($el, $item.find('.barpie'), data['number'], options['unit'], datas.length);
        });
      }).done(function(){
        // calculate total sum of numbers
        let sum = 0;
        datas.forEach(function (data, i) {
          sum = sum + data['number'];
        });
        // update width
        methods.updateBarpie($el, sum);
        // set height
        let barHeight = $el.find('> content > .chart > .bottom > li:first-child').outerHeight();
        $el.find('> content > .chart > .bottom').css({
          height: barHeight + 13 + 'px'
        })
        // show legends
        $el.find('> content > .chart > .bottom > li > span > .legend').delay(1500).fadeIn('slow');
        $el.find('> content > .chart > .bottom > li > .legend').delay(1500).fadeIn('slow');
      });
    },
    initBarpie: function($el, $item, num, unit, total){
      // set start item length
      $el.find('li.barpie').css({
        width: 'calc(' + (100/total) + '%)'
      });
    },
    updateBarpie: function($el, sum){
      let items = $el.find('li.barpie');
      _.each(items, function(item, i){
        let $item = $(item);
        let num = $item.find('> .barpie > .legend').text();
        num = parseInt(num);
        let perc = methods.getPercentage(num, sum);
        let bgColor = methods.percentageColor(perc+25);

        // li width
        $item.delay(500).animate({
          width: perc + '%'
        }, {
          duration: 1000,
          easign: {
            width: "easeout",
          },
          complete: function() {
            // // Animation complete.
          }
        });
        // bar color
        $item.find('> .barpie').delay(500).animate({
          backgroundColor: bgColor
        }, {
          duration: 1000,
          easign: {
            backgroundColor: "easeout"
          },
          complete: function() {
            // // Animation complete.
          }
        });

      })
    },
    updateBar: function($item, num, unit){
      let bgColor = methods.percentageColor(num);
      $item.delay(500).animate({
        width: num + '%',
        backgroundColor: bgColor
      }, {
        duration: 1000,
        easign: {
          width: "easeout",
          backgroundColor: "easeout"
        },
        complete: function() {
          // Animation complete.
          // set legend position
          methods.setBarLegendPosition($item.find('.legend'), num, unit);
        }
      });
    },
    setBarLegendPosition: function($item, num, unit){
      // set unit when update
      if(updateData){
        $item.text(num);
        if(unit=='percentage'){
          $item.append('%');
        };
      }

      let parentWidth = $item.parent().parent().outerWidth();
      let barWidth = $item.parent().outerWidth();
      let itemWidth = $item.outerWidth();


      let textLength = $item.text().length;
      if(textLength < 3){
        textLength = 3;
      }else if(textLength > 2 && textLength < 5 ){
        textLength = 4;
      }

      if(barWidth < parentWidth/3){
        $item.css({
          'right': '-' + (9 * textLength) + 'px'
        });
        $item.fadeIn( "slow" );
      }else{
        $item.css({
          'right': 6 + 'px'
        })
        $item.fadeIn( "slow" );
      }
    },
    percentageColor: function(num){
      let H = num; // hue
      let S = '90%'; // saturation
      let L = '50%'; // light

      var hslaText = "hsl(" + H + "," + S + "," + L + ")";
      return hslaText;
    },
    getPercentage: function(num, sum){
      let perc = num * 100 / sum;
      return perc;
    }
  }


  // Events
  var events = {

    // startOrder: function($el, options){
    //   if(!options.add){
    //     // sortable
    //     let sortable = options.sortable;
    //     var containerEl = $el.find('.items').first()[0];
    //
    //     if(sortable){
    //       Sortable.create(containerEl, {});
    //       events.dragItemsOrder($el, options);
    //     }else{
    //       Sortable.create(containerEl, {});
    //       $el.find('.item > .left').remove();
    //     }
    //   }
    //   events.dragItemsOrder($el, options);
    //   methods.updatePosition($el);
    //   events.removeItem($el, options);
    //
    // },
    // dragItemsOrder: function($el, options){
    //   let $items = $el.find('.items .item');
    //
    //   $items.bind({
    //     dragstart: function(event){
    //       $(event.target).addClass('indicator');
    //     },
    //     dragenter: function(event){
    //       $to = $(event.target).data('id');
    //       methods.updatePosition($el);
    //     },
    //     dragover: function(event){
    //     },
    //     dragend: function(event){
    //       $(event.target).removeClass('indicator');
    //       api.val($el); // trigger update ids
    //     },
    //     drop: function(event){
    //     }
    //   })
    // },
    // startSelect: function($el, options){
    //   events.clickItemsSelect($el, options);
    //   methods.updatePosition($el);
    //   events.removeItem($el, options);
    // },
    // dragItemsOrder: function($el, options){
    //   let $items = $el.find('.items .item');
    //
    //   $items.bind({
    //     dragstart: function(event){
    //       $(event.target).addClass('indicator');
    //     },
    //     dragenter: function(event){
    //       $to = $(event.target).data('id');
    //       methods.updatePosition($el);
    //     },
    //     dragover: function(event){
    //     },
    //     dragend: function(event){
    //       $(event.target).removeClass('indicator');
    //       api.val($el); // trigger update ids
    //     },
    //     drop: function(event){
    //     }
    //   })
    // },
    // clickItemsSelect: function($el, options){
    //   let $items = $el.find('.items .item');
    //
    //   $items.bind({
    //     click: function(event){
    //       let itemId = $(event.target).data('id');
    //       $items.removeClass('selected');
    //       $(event.target).addClass('selected');
    //
    //       $el.trigger('change', itemId);
    //     }
    //   })
    // },
    // clickOut: function($el, options){
    //   let $items = $el.find('content > .items');
    //   let $clear = $el.find('.clear');
    //   $(document).mouseup(function (e)
    //   {
    //       if (!$el.is(e.target) // if the target of the click isn't the $el...
    //           && $el.has(e.target).length === 0) // ... nor a descendant of the $el
    //       {
    //           $items.addClass('hide');
    //           $clear.addClass('hide')
    //       }
    //   });
    // },
    // removeItem: function($el, options){
    //   let $rm = $el.find('.remove');
    //
    //   // For each item, schedule an event for deletion
    //   // This event is attached only once, so it doesn't trigger
    //   // multiple times. An attribute in the data of the element
    //   // is used to track the scheduling.
    //   $.each($rm, function ($index, item) {
    //     var $item = $(item);
    //
    //     var scheduledToDelete = $item.data('scheduledToDelete');
    //     if (!scheduledToDelete) {
    //       $item.on("click", function(event){
    //         event.preventDefault();
    //         event.stopPropagation();
    //         let $this = $(event.target);
    //         $this.parent().remove();
    //         api.val($el);
    //         // trigger remove event and pass item id
    //         $el.trigger('delete', $(event.target).parent().data('id'));
    //       });
    //
    //       $item.data('scheduledToDelete', true);
    //     }
    //   });
    // }
  };

  // jquery component stuff
  $.fn.dwChart = function(methodOrOptions) {
      if ( api[methodOrOptions] ) {
          return api[ methodOrOptions ].apply( this, Array.prototype.slice.call( arguments, 1 ))
      } else if ( typeof methodOrOptions === 'object' || ! methodOrOptions ) {
          // Default to "init"
          return api.init.apply( this, arguments )
      } else {
          $.error( 'Method ' +  methodOrOptions + ' does not exist on jQuery.dwChart' )
      }
  };


})( jQuery )
