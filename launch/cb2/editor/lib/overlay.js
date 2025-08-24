function TouchOverlay() {
	var self = this;
	this.ed = null;

  this.touch_evt = null;
  
  this.single_tm = 0;
  this.single_cc = 0;
  this.single_tap = null;

  this.move_x = 0;
  this.move_y = 0;
  this.move_tm = 0;
  this.move_active = null;

  this.multi_mode = 0;
	
  this.focused = false;
  this.textarea = document.createElement('textarea');

	this.registerEditor = function(ed) {
		this.ed = ed;
	};

	this.unregisterEditor = function(ed) {
	};

  this.handle_click = function() {
    console.log('click');
  };

  this.handle_tap = function(num) {
    console.log('tap:' + num);
  };

  this.handle_press = function() {
    console.log('press');
  };

  this.handle_flick = function(dir) {
    console.log('flick:' + dir);
  };

  this.handle_move = function(dir) {
    console.log('move:' + dir);
  };

  this.handle_mode_on = function() {
    console.log('mode on');
  };

  this.handle_mode_off = function() {
    console.log('mode off');
  };

  this.handle_start = function() {
  };

  this.handle_end = function() {
  };

  this.handle_focus = function() {
  };
  
  this.isPressingModifier = function() {
    if (this.single_tm) return true;
    else return false;
  };

  this.cancelSinglePress = function() {
    this.single_cancel = 1;
    this.multi_mode = 0;
    this.single_tap = clearTimeout(this.single_tap);
  };

  this.blur = function() {
    var ta = self.textarea;
    ta.style.height = '100%';
    ta.style.width = '100%';

    self.focused = false;
    //self.overlay.style.display = 'none';
  };

  this.focus = function() {
    var ta = self.textarea;
    ta.style.height = '0';
    ta.style.width = '0';

    self.focused = true;
    //self.overlay.style.display = 'block';
  };

	this.show = function() {
		var overlay = document.createElement('div');
    overlay.classList.add('overlay');
    overlay.appendChild(self.textarea);

   	document.body.appendChild(overlay);

    self.overlay = overlay;

    self.textarea.addEventListener('focus', function(evt) {
      self.handle_focus();
      self.focus();
    });

    self.textarea.addEventListener('drop', function(evt) {
      console.log('xxxxxxxx');
    });

    //self.blur();
    self.focused = true;

    //==================================

    overlay.addEventListener('touchstart', function(evt) {
      if (!self.focused) return;

      var touches = evt.touches;

      if (touches.length == 1) {
        self.handle_start();
        self.touch_evt = touches[0];

        self.single_tm = (new Date().getTime());
        self.move_flick = clearTimeout(self.move_flick);
        self.move_active = null;
      }
      else {
        clearTimeout(self.single_tap);
        self.single_tm = 0;
        self.single_cc = 0;
      }

      evt.preventDefault();
      evt.stopPropagation();
    });    

    overlay.addEventListener('touchmove', function(evt) {
      //if (!self.focused) return;

      var x = evt.touches.length-1;
      var touches = evt.touches;
      var tm = (new Date().getTime());

      if (self.move_tm) {
        var td = tm - self.move_tm;
			  var xd = self.move_x - touches[x].clientX;
			  var yd = self.move_y - touches[x].clientY;

        var dir = null;
        var lock = null;

        if (xd > 5) {
          dir = 'left';
          lock = 'h';
        }
        else if (xd < -5) {
          dir = 'right';
          lock = 'h';
        }
        else if (yd >  5) {
          dir = 'up';
          lock = 'v';
        }
        else if (yd < -5) {
          dir = 'down';
          lock = 'v';
        }

        if (Math.abs(xd) > 5 || Math.abs(yd) > 5) {
          if (self.move_active) {
            if (self.move_active === lock) {
              self.handle_move(dir);
            }
          }
          else {
            console.log("td:" + td);
            if (td < 10 || self.move_flick) {
              clearTimeout(self.move_flick);
              self.move_flick = setTimeout(function() {
                self.handle_flick(dir);
              }, 100);
            }
            else {
              self.move_active = lock;
            }
          }

          self.move_tm = tm;
			    self.move_x = touches[x].clientX;
			    self.move_y = touches[x].clientY;
        }
      }
      else {
        if (touches.length > 1 && !self.multi_mode) {
          self.handle_mode_on();
          self.multi_mode = 1;
        }
        self.move_tm = tm;
			  self.move_x = touches[x].clientX;
			  self.move_y = touches[x].clientY;
      }

      //clear single
      self.single_tm = 0;
      self.single_cc = 0;
      self.single_tap = clearTimeout(self.single_tap);

      evt.preventDefault();
      evt.stopPropagation();
    });

    overlay.addEventListener('touchend', function(evt) {
      if (!self.focused) return;

      var touches = evt.touches;
      var tm = (new Date().getTime());

      if (touches.length == 0) {
        self.move_active = null;
        self.move_tm = 0;
        self.move_x = 0;
        self.move_y = 0;

        if (self.single_tm && !self.single_cancel) {
          var dd = (tm - self.single_tm);
          if (dd < 150) {
            self.single_cc++;

            self.single_tap = clearTimeout(self.single_tap);
            self.single_tap = setTimeout(function() {
              self.handle_tap(self.single_cc, self.touch_evt);
              self.single_cc = 0;
				    }, 310);

            return;
          }
          else if (dd < 3000) {
            self.handle_click(self.touch_evt);
            self.single_cc = 0;
          }
          else if (self.single_tm) {
            self.handle_press(self.touch_evt);
            self.single_cc = 0;
          }
        }
        self.single_tm = 0;

        if (self.multi_mode) {
          self.multi_mode = 0;
          self.handle_mode_off();
        }
        
        self.single_cancel = 0;
        self.handle_end();
      }

      clearTimeout(self.single_tap);

      evt.preventDefault();
      evt.stopPropagation();
    });    

	};
}
