/*
google buzz widget
for mootools 1.2
by eduardo chiaro

mootools dependencies
Full Core
mootools JSONP in mootools more

http://www.thedeveloperinside.com/blog/google-buzz-widget
*/


var GoogleBuzzWidget = new Class({
	Implements: [Options, Events],
	options: {
		element:		"buzz",		// container ID
		user:			"username",	// your Username (name or number, from your profile: http://www.gooogle.com/profiles/USERNAME
		buzzs:			5, 		// max number of buzzs
		comments:		5,		// max number of comments
		loadcomment:		true, 		// load comments 
		collapsecomment:	true, 		// auto show/hide comments
		cutcomment:		0,		// number of letters, 0 = no cut
		linkicon:		false, 		// use favicon in buzz links
		usestyle:		true,		// activate/deactivate auto style
	},
	statics: {
		buzzurl:			"http://buzz.googleapis.com/feeds/{user}/public/posted",
    		yqlurl:				"http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20feed%20where%20url%3D%22{location}%22%20limit%20{limit}&format=json"
	},
	initialize: function(options){
		this.setOptions(options);
		
		obj = this.statics.buzzurl.substitute({user: this.options.user});
	  
		url = this.statics.yqlurl.substitute({location: encodeURIComponent(obj),limit: encodeURIComponent(this.options.buzzs)});


		var request = new Request.JSONP({
			url: url,
			onComplete: function(data) {
				this.loadWidget(data);
       		}.bind(this)
		}).send();
	},
	loadWidget: function(buzz){
		if(buzz.query.count>0) $(this.options.element).set("html","");
		buzz.query.results.entry.each(function(entry,i){

			mydiv = new Element('div', {html: (entry.content.content || entry.content[0].content).clean(), 'class': 'bzw_buzz'});
			
			myname = new Element('h3', {html:entry.author.name});
			myname.inject(mydiv,"top");
			
			mysource = new Element('a', {
					html:"source", 
					href:"source", 
					title: entry.title.content.replace("Buzz by "+entry.author.name+" from","").clean(), 
					'class': 'bzw_source'
				});
			mysource.inject(myname,"after");
			
			myenc = new Element('div',{'class':'bzw_links'});
			myenc.inject(mydiv);
			
			entry.link.each(function(link){
				switch(link.rel){
					case "enclosure":
						this.makeEnclosure(link,myenc);
						break;
					case "replies":
						if(this.options.loadcomment) this.makeComments(link,mydiv,i);
						break;
					case "alternate":
						mysource.set("href",link.href);
					
						break;
				}
				
			}, this, entry, myenc, mysource, i);
			
			mydiv.inject($(this.options.element));

			mydiv.setStyle("opacity","0");
			
			var myFx = new Fx.Tween(mydiv, {duration: "long"});
			myFx.start('opacity', '0', '1');
		}, this);



		if(this.options.usestyle) this.setStyles();
		
	},
	makeEnclosure: function (link,myenc){
		
		classname = "link";
		if(link.href.test("flickr.com", "i")){
			classname = "flickr";
		}
		if(link.href.test("feedproxy.google.com", "i")){
			//classname = "rss";
		}
		if(link.href.test("picasaweb.google.com", "i")){
			classname = "picasa";
		}
		switch(link.type){
			case "text/html":
				
				break;
			case "image/gif":
			case "image/jpg":
			case "image/jpeg":
			case "image/png":
			case "image/bmp":
				
				break;
		}

		mylink = new Element('a', {
			'href':		link.href, 
			'class':	classname,
			'title':	link.title,
			'html':		/*((link.title)?link.title.clean():link.href)*/classname
		});
		mylink.inject(myenc);

		if(this.options.linkicon){
			myimg = new Element('img', {
				'src':		"http://www.google.com/s2/favicons?domain="+this.getHostnameFromUrl(link.href)
			});
			myimg.inject(mylink,'top');
			mylink.addClass('image');
		}

		if(this.options.usestyle) this.setStylesEnclosure.delay(20); 
	},
	makeComments: function(link,mydiv,i){
		
		url = this.statics.yqlurl.substitute({location: encodeURIComponent(link.href),limit: encodeURIComponent(this.options.comments)});

		new Request.JSONP({
			url: url,
			onComplete: function(comments) {
				this.loadComments(comments,mydiv,i);
       		}.bind(this).bind(i)
		}).send();	
		
	},
	loadComments: function(comments,mydiv,randid){
		if(comments.query.count > 0){

			var mycomms = new Element('div', {'class': 'bzw_comments','id': 'buzz-'+randid});
			mycomms.inject(mydiv);
			
			if(this.options.collapsecomment){
				myacomms = new Element('a', {'class': 'bzw_hidecomments','href':  '#buzz-'+randid, 'html': 'comments'+'('+comments.query.count+')'});
				myacomms.inject(mycomms,"before");
				
				myclear = new Element('div', {'style': 'clear:both'});
				myclear.inject(myacomms,"after");
				
				new Fx.Slide(mycomms).hide();
				myacomms.addEvent("click",function(e){
					new Fx.Slide(mycomms).toggle();
				});
			}
			comments.query.results.entry.each(function(entry){
				text = (entry.content.content || entry.content[0].content).clean();
				if(this.options.cutcomment) text = text.substr(0,this.options.cutcomment-1)+"...";
				mycomm = new Element('div', {'class': 'bzw_comment', html: "<h5>"+entry.author.name.clean()+"</h5>: "+text});
				mycomm.inject(mycomms);
			}, this);
			
		}

		if(this.options.usestyle) this.setStylesComments.delay(30); 
	},
	getHostnameFromUrl: function(url) {
		return (url.match(/:\/\/(.[^/]+)/)[1]).replace('www.','');
	},
	setStyles: function(){
		$$(".bzw_buzz").setStyles({
			'background': '#FAFBFF',
			'color': '#000000',
			'padding': '8px',
			'margin-bottom': '20px',
			'-webkit-border-radius': '5px',
			'-moz-border-radius': '5px',
			'border-radius': '5px',
			'-webkit-box-shadow': '0 2px 5px #333333',
			'-moz-box-shadow': '0 2px 5px #333333',
			'box-shadow': '0 2px 5px #333333',
			'position': 'relative',
			'overflow': 'hidden'
		});
		
		$$(".bzw_buzz a").setStyles({
			'color': '#4F5D68',
			'text-decoration': 'none',
			'font-weight': 'bold'
		});
		
		$$(".bzw_buzz a").addEvent("mouseover",function(){this.setStyles({'text-decoration': 'underline'});});
		
		$$(".bzw_buzz a").addEvent("mouseout",function(){this.setStyles({'text-decoration': 'none'});});
		
		$$(".bzw_buzz h3").setStyles({
			'margin': '0',
			'padding': '0'
		});
		$$(".bzw_buzz .bzw_source").setStyles({
			'margin': '0',
			'padding': '0'
		});
		$$(".bzw_buzz h3").setStyles({
			'margin-bottom': '5px'
		});
		$$(".bzw_buzz .bzw_source").setStyles({
			'position': 'absolute',
			'color': '#FFFFFF',
			'top':'2px',
			'right': '5px',
			'text-shadow':'0 0 2px #000000',
			'text-decoration': 'none',
			'font-size': '12px',
		});
		
		$$(".bzw_buzz .bzw_source").addEvent("mouseover",function(){
			this.setStyles({
				'color':'#d62121',
				'text-shadow':'0 0 2px #f1f1f1'
			});
		});
		
		$$(".bzw_buzz .bzw_source").addEvent("mouseout",function(){
			this.setStyles({
				'color': '#FFFFFF',
				'text-shadow':'0 0 2px #000000'
			});
		});
	},
	setStylesEnclosure: function(){
		$$(".bzw_buzz .bzw_links a").setStyles({
			'margin':'5px 5px 0 0',
			'background': '#222',
			'display': 'inline-block',
			'padding': '2px 4px 3px',
			'color': '#ffffff',
			'text-decoration': 'none',
			'font-weight': 'bold',
			'line-height': '1',
			'-moz-border-radius': '2px',
			'-webkit-border-radius': '2px',
			'-moz-box-shadow': '0 1px 1px #999999',
			'-webkit-box-shadow': '0 1px 1px #999999',
			'text-shadow': '0 0 1px #222222',
			'position': 'relative',
			'cursor': 'pointer'
		});
		$$(".bzw_buzz .bzw_links a:hover").setStyles({
			'background': '#111'
		});

		
		$$(".bzw_buzz .bzw_links a").addEvent("mouseover",function(){
			this.setStyles({
				'background': '#222'
			});
		});
		
		$$(".bzw_buzz .bzw_links a").addEvent("mouseout",function(){
			this.setStyles({
				'background': '#222'
			});
		});
		
		$$(".bzw_buzz .bzw_links a.image").setStyles({
			'position': 'relative',
			'padding-left': '20px'
		});
		$$(".bzw_buzz .bzw_links a img").setStyles({
			'position': 'absolute',
			'top': '0',
			'left': '0',
			'border': 'none',
			'-moz-border-radius-topleft': '2px',
			'-moz-border-radius-bottomleft': '2px',
			'-webkit-border-top-left-radius': '2px',
			'-webkit-border-bottom-left-radius': '2px'
		});
		
		$$(".bzw_buzz .bzw_links a.link").setStyles({ 'background-color': '#91bd09' });
		
		$$(".bzw_buzz .bzw_links a.link").addEvent("mouseover",function(){this.setStyles({'background': '#749a02'});});
		
		$$(".bzw_buzz .bzw_links a.link").addEvent("mouseout",function(){this.setStyles({'background-color': '#91bd09'});});
		
		
		$$(".bzw_buzz .bzw_links a.rss").setStyles({ 'background-color': '#ff5c00' });
		
		$$(".bzw_buzz .bzw_links a.rss").addEvent("mouseover",function(){this.setStyles({'background': '#d45500'});});
		
		$$(".bzw_buzz .bzw_links a.rss").addEvent("mouseout",function(){this.setStyles({'background-color': '#ff5c00'});});
		
		
		$$(".bzw_buzz .bzw_links a.flickr").setStyles({ 'background-color': '#a9014b' });
		
		$$(".bzw_buzz .bzw_links a.flickr").addEvent("mouseover",function(){this.setStyles({'background': '#630030'});});
		
		$$(".bzw_buzz .bzw_links a.flickr").addEvent("mouseout",function(){this.setStyles({'background-color': '#a9014b'});});
		
		
		$$(".bzw_buzz .bzw_links a.picasa").setStyles({ 'background-color': '#ffb515' });
		
		$$(".bzw_buzz .bzw_links a.picasa").addEvent("mouseover",function(){this.setStyles({'background': '#fc9200'});});
		
		$$(".bzw_buzz .bzw_links a.picasa").addEvent("mouseout",function(){this.setStyles({'background-color': '#ffb515'});});
	},
	setStylesComments: function(){
		$$(".bzw_buzz .bzw_comments").setStyles({
			'font-size': '10px',
			'margin': '5px 10px 0',
			'padding': '5px 0 0 10px',
			'border-top': '1px solid #4F5D68'
		});
		$$(".bzw_buzz .bzw_comment").setStyles({
			'padding-bottom': '5px'
		});
		$$(".bzw_buzz .bzw_comment h5").setStyles({
			'display': 'inline',
		 	'font-size': '11px'
		});
		$$(".bzw_buzz .bzw_hidecomments").setStyles({
			'float': 'right',
			'margin': '3px 0',
			'color': '#4F5D68',
			'text-decoration': 'none',
			'font-weight': 'bold'
		});

		$$(".bzw_buzz a").addEvent("mouseover",function(){this.setStyles({'text-decoration': 'underline'});});
		
		$$(".bzw_buzz a").addEvent("mouseout",function(){this.setStyles({'text-decoration': 'none'});});
	}
	
});
