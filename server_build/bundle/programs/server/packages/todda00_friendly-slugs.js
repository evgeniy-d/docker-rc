(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var check = Package.check.check;
var Match = Package.check.Match;
var CollectionHooks = Package['matb33:collection-hooks'].CollectionHooks;

/* Package-scope variables */
var __coffeescriptShare;

(function(){

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                 //
// packages/todda00_friendly-slugs/slugs.coffee.js                                                                 //
//                                                                                                                 //
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                   //
__coffeescriptShare = typeof __coffeescriptShare === 'object' ? __coffeescriptShare : {}; var share = __coffeescriptShare;
var Mongo, slugify, stringToNested;

if (typeof Mongo === "undefined") {
  Mongo = {};
  Mongo.Collection = Meteor.Collection;
}

Mongo.Collection.prototype.friendlySlugs = function(options) {
  var collection, fsDebug, runSlug;
  if (options == null) {
    options = {};
  }
  collection = this;
  if (!_.isArray(options)) {
    options = [options];
  }
  _.each(options, function(opts) {
    var defaults, fields;
    if (_.isString(opts)) {
      opts = {
        slugFrom: [opts]
      };
    }
    if (_.isString(opts.slugFrom)) {
      opts.slugFrom = [opts.slugFrom];
    }
    defaults = {
      slugFrom: ['name'],
      slugField: 'slug',
      distinct: true,
      distinctUpTo: [],
      updateSlug: true,
      createOnUpdate: true,
      maxLength: 0,
      debug: false,
      transliteration: [
        {
          from: 'àáâäåãа',
          to: 'a'
        }, {
          from: 'б',
          to: 'b'
        }, {
          from: 'ç',
          to: 'c'
        }, {
          from: 'д',
          to: 'd'
        }, {
          from: 'èéêëẽэе',
          to: 'e'
        }, {
          from: 'ф',
          to: 'f'
        }, {
          from: 'г',
          to: 'g'
        }, {
          from: 'х',
          to: 'h'
        }, {
          from: 'ìíîïи',
          to: 'i'
        }, {
          from: 'к',
          to: 'k'
        }, {
          from: 'л',
          to: 'l'
        }, {
          from: 'м',
          to: 'm'
        }, {
          from: 'ñн',
          to: 'n'
        }, {
          from: 'òóôöõо',
          to: 'o'
        }, {
          from: 'п',
          to: 'p'
        }, {
          from: 'р',
          to: 'r'
        }, {
          from: 'с',
          to: 's'
        }, {
          from: 'т',
          to: 't'
        }, {
          from: 'ùúûüу',
          to: 'u'
        }, {
          from: 'в',
          to: 'v'
        }, {
          from: 'йы',
          to: 'y'
        }, {
          from: 'з',
          to: 'z'
        }, {
          from: 'æ',
          to: 'ae'
        }, {
          from: 'ч',
          to: 'ch'
        }, {
          from: 'щ',
          to: 'sch'
        }, {
          from: 'ш',
          to: 'sh'
        }, {
          from: 'ц',
          to: 'ts'
        }, {
          from: 'я',
          to: 'ya'
        }, {
          from: 'ю',
          to: 'yu'
        }, {
          from: 'ж',
          to: 'zh'
        }, {
          from: 'ъь',
          to: ''
        }
      ]
    };
    _.defaults(opts, defaults);
    fields = {
      slugFrom: Array,
      slugField: String,
      distinct: Boolean,
      createOnUpdate: Boolean,
      maxLength: Number,
      debug: Boolean
    };
    if (typeof opts.updateSlug !== "function") {
      if (opts.updateSlug) {
        opts.updateSlug = function() {
          return true;
        };
      } else {
        opts.updateSlug = function() {
          return false;
        };
      }
    }
    check(opts, Match.ObjectIncluding(fields));
    collection.before.insert(function(userId, doc) {
      fsDebug(opts, 'before.insert function');
      runSlug(doc, opts);
    });
    collection.before.update(function(userId, doc, fieldNames, modifier, options) {
      var cleanModifier, cont, slugFromChanged;
      fsDebug(opts, 'before.update function');
      cleanModifier = function() {
        if (_.isEmpty(modifier.$set)) {
          return delete modifier.$set;
        }
      };
      options = options || {};
      if (options.multi) {
        fsDebug(opts, "multi doc update attempted, can't update slugs this way, leaving.");
        return true;
      }
      modifier = modifier || {};
      modifier.$set = modifier.$set || {};
      cont = false;
      _.each(opts.slugFrom, function(slugFrom) {
        if (stringToNested(doc, slugFrom) || (modifier.$set[slugFrom] != null) || stringToNested(modifier.$set, slugFrom)) {
          return cont = true;
        }
      });
      if (!cont) {
        fsDebug(opts, "no slugFrom fields are present (either before or after update), leaving.");
        cleanModifier();
        return true;
      }
      slugFromChanged = false;
      _.each(opts.slugFrom, function(slugFrom) {
        var docFrom;
        if ((modifier.$set[slugFrom] != null) || stringToNested(modifier.$set, slugFrom)) {
          docFrom = stringToNested(doc, slugFrom);
          if ((docFrom !== modifier.$set[slugFrom]) && (docFrom !== stringToNested(modifier.$set, slugFrom))) {
            return slugFromChanged = true;
          }
        }
      });
      fsDebug(opts, slugFromChanged, 'slugFromChanged');
      if (!stringToNested(doc, opts.slugField) && opts.createOnUpdate) {
        fsDebug(opts, 'Update: Slug Field is missing and createOnUpdate is set to true');
        if (slugFromChanged) {
          fsDebug(opts, 'slugFrom field has changed, runSlug with modifier');
          runSlug(doc, opts, modifier);
        } else {
          fsDebug(opts, 'runSlug to create');
          runSlug(doc, opts, modifier, true);
          cleanModifier();
          return true;
        }
      } else {
        if ((typeof opts.updateSlug === "function" ? opts.updateSlug(doc, modifier) : void 0) === false) {
          fsDebug(opts, 'updateSlug is false, nothing to do.');
          cleanModifier();
          return true;
        }
        if (!slugFromChanged) {
          fsDebug(opts, 'slugFrom field has not changed, nothing to do.');
          cleanModifier();
          return true;
        }
        runSlug(doc, opts, modifier);
        cleanModifier();
        return true;
      }
      cleanModifier();
      return true;
    });
  });
  runSlug = function(doc, opts, modifier, create) {
    var baseField, combineFrom, defaultSlugGenerator, f, fieldSelector, finalSlug, from, i, index, indexField, limitSelector, ref, result, slugBase, slugGenerator, sortSelector;
    if (modifier == null) {
      modifier = false;
    }
    if (create == null) {
      create = false;
    }
    fsDebug(opts, 'Begin runSlug');
    fsDebug(opts, opts, 'Options');
    fsDebug(opts, modifier, 'Modifier');
    fsDebug(opts, create, 'Create');
    combineFrom = function(doc, fields, modifierDoc) {
      var fromValues;
      fromValues = [];
      _.each(fields, function(f) {
        var val;
        if (modifierDoc != null) {
          if (stringToNested(modifierDoc, f)) {
            val = stringToNested(modifierDoc, f);
          } else {
            val = stringToNested(doc, f);
          }
        } else {
          val = stringToNested(doc, f);
        }
        if (val) {
          return fromValues.push(val);
        }
      });
      if (fromValues.length === 0) {
        return false;
      }
      return fromValues.join('-');
    };
    from = create || !modifier ? combineFrom(doc, opts.slugFrom) : combineFrom(doc, opts.slugFrom, modifier.$set);
    if (from === false) {
      fsDebug(opts, "Nothing to slug from, leaving.");
      return true;
    }
    fsDebug(opts, from, 'Slugging From');
    slugBase = slugify(from, opts.transliteration, opts.maxLength);
    if (!slugBase) {
      return false;
    }
    fsDebug(opts, slugBase, 'SlugBase before reduction');
    if (opts.distinct) {
      slugBase = slugBase.replace(/(-\d+)+$/, '');
      fsDebug(opts, slugBase, 'SlugBase after reduction');
      baseField = "friendlySlugs." + opts.slugField + ".base";
      indexField = "friendlySlugs." + opts.slugField + ".index";
      fieldSelector = {};
      fieldSelector[baseField] = slugBase;
      i = 0;
      while (i < opts.distinctUpTo.length) {
        f = opts.distinctUpTo[i];
        fieldSelector[f] = doc[f];
        i++;
      }
      sortSelector = {};
      sortSelector[indexField] = -1;
      limitSelector = {};
      limitSelector[indexField] = 1;
      result = collection.findOne(fieldSelector, {
        sort: sortSelector,
        fields: limitSelector,
        limit: 1
      });
      fsDebug(opts, result, 'Highest indexed base found');
      if ((result == null) || (result.friendlySlugs == null) || (result.friendlySlugs[opts.slugField] == null) || (result.friendlySlugs[opts.slugField].index == null)) {
        index = 0;
      } else {
        index = result.friendlySlugs[opts.slugField].index + 1;
      }
      defaultSlugGenerator = function(slugBase, index) {
        if (index === 0) {
          return slugBase;
        } else {
          return slugBase + '-' + index;
        }
      };
      slugGenerator = (ref = opts.slugGenerator) != null ? ref : defaultSlugGenerator;
      finalSlug = slugGenerator(slugBase, index);
    } else {
      index = false;
      finalSlug = slugBase;
    }
    fsDebug(opts, finalSlug, 'finalSlug');
    if (modifier || create) {
      fsDebug(opts, 'Set to modify or create slug on update');
      modifier = modifier || {};
      modifier.$set = modifier.$set || {};
      modifier.$set.friendlySlugs = doc.friendlySlugs || {};
      modifier.$set.friendlySlugs[opts.slugField] = modifier.$set.friendlySlugs[opts.slugField] || {};
      modifier.$set.friendlySlugs[opts.slugField].base = slugBase;
      modifier.$set.friendlySlugs[opts.slugField].index = index;
      modifier.$set[opts.slugField] = finalSlug;
      fsDebug(opts, modifier, 'Final Modifier');
    } else {
      fsDebug(opts, 'Set to update');
      doc.friendlySlugs = doc.friendlySlugs || {};
      doc.friendlySlugs[opts.slugField] = doc.friendlySlugs[opts.slugField] || {};
      doc.friendlySlugs[opts.slugField].base = slugBase;
      doc.friendlySlugs[opts.slugField].index = index;
      doc[opts.slugField] = finalSlug;
      fsDebug(opts, doc, 'Final Doc');
    }
    return true;
  };
  return fsDebug = function(opts, item, label) {
    if (label == null) {
      label = '';
    }
    if (!opts.debug) {
      return;
    }
    if (typeof item === 'object') {
      console.log("friendlySlugs DEBUG: " + label + '↓');
      return console.log(item);
    } else {
      return console.log("friendlySlugs DEBUG: " + label + '= ' + item);
    }
  };
};

slugify = function(text, transliteration, maxLength) {
  var lastDash, slug;
  if (text == null) {
    return false;
  }
  if (text.length < 1) {
    return false;
  }
  text = text.toString().toLowerCase();
  _.each(transliteration, function(item) {
    return text = text.replace(new RegExp('[' + item.from + ']', 'g'), item.to);
  });
  slug = text.replace(/'/g, '').replace(/[^0-9a-z-]/g, '-').replace(/\-\-+/g, '-').replace(/^-+/, '').replace(/-+$/, '');
  if (maxLength > 0 && slug.length > maxLength) {
    lastDash = slug.substring(0, maxLength).lastIndexOf('-');
    slug = slug.substring(0, lastDash);
  }
  return slug;
};

stringToNested = function(obj, path) {
  var parts;
  parts = path.split(".");
  if (parts.length === 1) {
    if ((obj != null) && (obj[parts[0]] != null)) {
      return obj[parts[0]];
    } else {
      return false;
    }
  }
  return stringToNested(obj[parts[0]], parts.slice(1).join("."));
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}).call(this);


/* Exports */
Package._define("todda00:friendly-slugs");

})();

//# sourceURL=meteor://💻app/packages/todda00_friendly-slugs.js
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1ldGVvcjovL/CfkrthcHAvcGFja2FnZXMvdG9kZGEwMF9mcmllbmRseS1zbHVncy9zbHVncy5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFDQTs7QUFBQSxJQUFHLGlCQUFnQixXQUFuQjtBQUNFLFVBQVEsRUFBUjtBQUFBLEVBQ0EsS0FBSyxDQUFDLFVBQU4sR0FBbUIsTUFBTSxDQUFDLFVBRDFCLENBREY7Q0FBQTs7QUFBQSxLQUlLLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxhQUEzQixHQUEyQyxTQUFDLE9BQUQ7QUFDekM7O0lBRDBDLFVBQVU7R0FDcEQ7QUFBQSxlQUFhLElBQWI7QUFFQSxNQUFHLEVBQUUsQ0FBQyxPQUFGLENBQVUsT0FBVixDQUFKO0FBQ0UsY0FBVSxDQUFDLE9BQUQsQ0FBVixDQURGO0dBRkE7QUFBQSxFQUtBLENBQUMsQ0FBQyxJQUFGLENBQU8sT0FBUCxFQUFnQixTQUFDLElBQUQ7QUFDZDtBQUFBLFFBQUcsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxJQUFYLENBQUg7QUFDRSxhQUFPO0FBQUEsUUFDTCxVQUFVLENBQUMsSUFBRCxDQURMO09BQVAsQ0FERjtLQUFBO0FBSUEsUUFBbUMsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxJQUFJLENBQUMsUUFBaEIsQ0FBbkM7QUFBQSxVQUFJLENBQUMsUUFBTCxHQUFnQixDQUFDLElBQUksQ0FBQyxRQUFOLENBQWhCO0tBSkE7QUFBQSxJQU1BLFdBQ0U7QUFBQSxnQkFBVSxDQUFDLE1BQUQsQ0FBVjtBQUFBLE1BQ0EsV0FBVyxNQURYO0FBQUEsTUFFQSxVQUFVLElBRlY7QUFBQSxNQUdBLGNBQWMsRUFIZDtBQUFBLE1BSUEsWUFBWSxJQUpaO0FBQUEsTUFLQSxnQkFBZ0IsSUFMaEI7QUFBQSxNQU1BLFdBQVcsQ0FOWDtBQUFBLE1BT0EsT0FBTyxLQVBQO0FBQUEsTUFRQSxpQkFBaUI7UUFDZjtBQUFBLFVBQUMsTUFBTSxTQUFQO0FBQUEs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LEVBQXBELEVBRGU7RUFBQSxDQUF4QixDQUhBO0FBQUEsRUFLQSxPQUFPLElBQ0wsQ0FBQyxPQURJLENBQ0ksSUFESixFQUNVLEVBRFYsQ0FFTCxDQUFDLE9BRkksQ0FFSSxhQUZKLEVBRW1CLEdBRm5CLENBR0wsQ0FBQyxPQUhJLENBR0ksUUFISixFQUdjLEdBSGQsQ0FJTCxDQUFDLE9BSkksQ0FJSSxLQUpKLEVBSVcsRUFKWCxDQUtMLENBQUMsT0FMSSxDQUtJLEtBTEosRUFLVyxFQUxYLENBTFA7QUFXQSxNQUFHLFlBQVksQ0FBWixJQUFpQixJQUFJLENBQUMsTUFBTCxHQUFjLFNBQWxDO0FBQ0UsZUFBVyxJQUFJLENBQUMsU0FBTCxDQUFlLENBQWYsRUFBaUIsU0FBakIsQ0FBMkIsQ0FBQyxXQUE1QixDQUF3QyxHQUF4QyxDQUFYO0FBQUEsSUFDQSxPQUFPLElBQUksQ0FBQyxTQUFMLENBQWUsQ0FBZixFQUFpQixRQUFqQixDQURQLENBREY7R0FYQTtBQWNBLFNBQU8sSUFBUCxDQWZRO0FBQUEsQ0ExUVY7O0FBQUEsY0EyUkEsR0FBaUIsU0FBQyxHQUFELEVBQU0sSUFBTjtBQUNmO0FBQUEsVUFBUSxJQUFJLENBQUMsS0FBTCxDQUFXLEdBQVgsQ0FBUjtBQUNBLE1BQUcsS0FBSyxDQUFDLE1BQU4sS0FBYyxDQUFqQjtBQUNFLFFBQUcsaUJBQVEsdUJBQVg7QUFDRSxhQUFPLEdBQUksTUFBTSxHQUFOLENBQVgsQ0FERjtLQUFBO0FBR0UsYUFBTyxLQUFQLENBSEY7S0FERjtHQURBO0FBTUEsU0FBTyxlQUFlLEdBQUksTUFBTSxHQUFOLENBQW5CLEVBQThCLEtBQUssQ0FBQyxLQUFOLENBQVksQ0FBWixDQUFjLENBQUMsSUFBZixDQUFvQixHQUFwQixDQUE5QixDQUFQLENBUGU7QUFBQSxDQTNSakIiLCJmaWxlIjoiL3BhY2thZ2VzL3RvZGRhMDBfZnJpZW5kbHktc2x1Z3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyIjIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5XG5pZiB0eXBlb2YgTW9uZ28gaXMgXCJ1bmRlZmluZWRcIlxuICBNb25nbyA9IHt9XG4gIE1vbmdvLkNvbGxlY3Rpb24gPSBNZXRlb3IuQ29sbGVjdGlvblxuXG5Nb25nby5Db2xsZWN0aW9uLnByb3RvdHlwZS5mcmllbmRseVNsdWdzID0gKG9wdGlvbnMgPSB7fSkgLT5cbiAgY29sbGVjdGlvbiA9IEBcblxuICBpZiAhXy5pc0FycmF5KG9wdGlvbnMpXG4gICAgb3B0aW9ucyA9IFtvcHRpb25zXVxuXG4gIF8uZWFjaCBvcHRpb25zLCAob3B0cykgLT5cbiAgICBpZiBfLmlzU3RyaW5nKG9wdHMpXG4gICAgICBvcHRzID0ge1xuICAgICAgICBzbHVnRnJvbTogW29wdHNdXG4gICAgICB9XG4gICAgb3B0cy5zbHVnRnJvbSA9IFtvcHRzLnNsdWdGcm9tXSBpZiBfLmlzU3RyaW5nIG9wdHMuc2x1Z0Zyb21cblxuICAgIGRlZmF1bHRzID1cbiAgICAgIHNsdWdGcm9tOiBbJ25hbWUnXVxuICAgICAgc2x1Z0ZpZWxkOiAnc2x1ZydcbiAgICAgIGRpc3RpbmN0OiB0cnVlXG4gICAgICBkaXN0aW5jdFVwVG86IFtdXG4gICAgICB1cGRhdGVTbHVnOiB0cnVlXG4gICAgICBjcmVhdGVPblVwZGF0ZTogdHJ1ZVxuICAgICAgbWF4TGVuZ3RoOiAwXG4gICAgICBkZWJ1ZzogZmFsc2VcbiAgICAgIHRyYW5zbGl0ZXJhdGlvbjogW1xuICAgICAgICB7ZnJvbTogJ8Ogw6HDosOkw6XDo9CwJywgdG86ICdhJ31cbiAgICAgICAge2Zyb206ICfQsScsICAgICAgdG86ICdiJ31cbiAgICAgICAge2Zyb206ICfDpycsICAgICAgdG86ICdjJ31cbiAgICAgICAge2Zyb206ICfQtCcsICAgICAgdG86ICdkJ31cbiAgICAgICAge2Zyb206ICfDqMOpw6rDq+G6vdGN0LUnLHRvOiAnZSd9XG4gICAgICAgIHtmcm9tOiAn0YQnLCAgICAgIHRvOiAnZid9XG4gICAgICAgIHtmcm9tOiAn0LMnLCAgICAgIHRvOiAnZyd9XG4gICAgICAgIHtmcm9tOiAn0YUnLCAgICAgIHRvOiAnaCd9XG4gICAgICAgIHtmcm9tOiAnw6zDrcOuw6/QuCcsICB0bzogJ2knfVxuICAgICAgICB7ZnJvbTogJ9C6JywgICAgICB0bzogJ2snfVxuICAgICAgICB7ZnJvbTogJ9C7JywgICAgICB0bzogJ2wnfVxuICAgICAgICB7ZnJvbTogJ9C8JywgICAgICB0bzogJ20nfVxuICAgICAgICB7ZnJvbTogJ8Ox0L0nLCAgICAgdG86ICduJ31cbiAgICAgICAge2Zyb206ICfDssOzw7TDtsO10L4nLCB0bzogJ28nfVxuICAgICAgICB7ZnJvbTogJ9C/JywgICAgICB0bzogJ3AnfVxuICAgICAgICB7ZnJvbTogJ9GAJywgICAgICB0bzogJ3InfVxuICAgICAgICB7ZnJvbTogJ9GBJywgICAgICB0bzogJ3MnfVxuICAgICAgICB7ZnJvbTogJ9GCJywgICAgICB0bzogJ3QnfVxuICAgICAgICB7ZnJvbTogJ8O5w7rDu8O80YMnLCAgdG86ICd1J31cbiAgICAgICAge2Zyb206ICfQsicsICAgICAgdG86ICd2J31cbiAgICAgICAge2Zyb206ICfQudGLJywgICAgIHRvOiAneSd9XG4gICAgICAgIHtmcm9tOiAn0LcnLCAgICAgIHRvOiAneid9XG4gICAgICAgIHtmcm9tOiAnw6YnLCAgICAgIHRvOiAnYWUnfVxuICAgICAgICB7ZnJvbTogJ9GHJywgICAgICB0bzogJ2NoJ31cbiAgICAgICAge2Zyb206ICfRiScsICAgICAgdG86ICdzY2gnfVxuICAgICAgICB7ZnJvbTogJ9GIJywgICAgICB0bzogJ3NoJ31cbiAgICAgICAge2Zyb206ICfRhicsICAgICAgdG86ICd0cyd9XG4gICAgICAgIHtmcm9tOiAn0Y8nLCAgICAgIHRvOiAneWEnfVxuICAgICAgICB7ZnJvbTogJ9GOJywgICAgICB0bzogJ3l1J31cbiAgICAgICAge2Zyb206ICfQticsICAgICAgdG86ICd6aCd9XG4gICAgICAgIHtmcm9tOiAn0YrRjCcsICAgICB0bzogJyd9XG4gICAgICBdXG5cbiAgICBfLmRlZmF1bHRzKG9wdHMsIGRlZmF1bHRzKVxuXG4gICAgZmllbGRzID1cbiAgICAgIHNsdWdGcm9tOiBBcnJheVxuICAgICAgc2x1Z0ZpZWxkOiBTdHJpbmdcbiAgICAgIGRpc3RpbmN0OiBCb29sZWFuXG4gICAgICBjcmVhdGVPblVwZGF0ZTogQm9vbGVhblxuICAgICAgbWF4TGVuZ3RoOiBOdW1iZXJcbiAgICAgIGRlYnVnOiBCb29sZWFuXG5cbiAgICBpZiB0eXBlb2Ygb3B0cy51cGRhdGVTbHVnICE9IFwiZnVuY3Rpb25cIlxuICAgICAgaWYgKG9wdHMudXBkYXRlU2x1ZylcbiAgICAgICAgb3B0cy51cGRhdGVTbHVnID0gKCkgLT4gdHJ1ZVxuICAgICAgZWxzZVxuICAgICAgICBvcHRzLnVwZGF0ZVNsdWcgPSAoKSAtPiBmYWxzZVxuXG5cbiAgICBjaGVjayhvcHRzLE1hdGNoLk9iamVjdEluY2x1ZGluZyhmaWVsZHMpKVxuXG4gICAgY29sbGVjdGlvbi5iZWZvcmUuaW5zZXJ0ICh1c2VySWQsIGRvYykgLT5cbiAgICAgIGZzRGVidWcob3B0cywnYmVmb3JlLmluc2VydCBmdW5jdGlvbicpXG4gICAgICBydW5TbHVnKGRvYyxvcHRzKVxuICAgICAgcmV0dXJuXG5cbiAgICBjb2xsZWN0aW9uLmJlZm9yZS51cGRhdGUgKHVzZXJJZCwgZG9jLCBmaWVsZE5hbWVzLCBtb2RpZmllciwgb3B0aW9ucykgLT5cbiAgICAgIGZzRGVidWcob3B0cywnYmVmb3JlLnVwZGF0ZSBmdW5jdGlvbicpXG4gICAgICBjbGVhbk1vZGlmaWVyID0gKCkgLT5cbiAgICAgICAgI0NsZWFudXAgdGhlIG1vZGlmaWVyIGlmIG5lZWRlZFxuICAgICAgICBkZWxldGUgbW9kaWZpZXIuJHNldCBpZiBfLmlzRW1wdHkobW9kaWZpZXIuJHNldClcblxuICAgICAgI0Rvbid0IGRvIGFueXRoaW5nIGlmIHRoaXMgaXMgYSBtdWx0aSBkb2MgdXBkYXRlXG4gICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgICAgaWYgb3B0aW9ucy5tdWx0aVxuICAgICAgICBmc0RlYnVnKG9wdHMsXCJtdWx0aSBkb2MgdXBkYXRlIGF0dGVtcHRlZCwgY2FuJ3QgdXBkYXRlIHNsdWdzIHRoaXMgd2F5LCBsZWF2aW5nLlwiKVxuICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICBtb2RpZmllciA9IG1vZGlmaWVyIHx8IHt9XG4gICAgICBtb2RpZmllci4kc2V0ID0gbW9kaWZpZXIuJHNldCB8fCB7fVxuXG4gICAgICAjRG9uJ3QgZG8gYW55dGhpbmcgaWYgYWxsIHRoZSBzbHVnRnJvbSBmaWVsZHMgYXJlbid0IHByZXNlbnQgKGJlZm9yZSBvciBhZnRlciB1cGRhdGUpXG4gICAgICBjb250ID0gZmFsc2VcbiAgICAgIF8uZWFjaCBvcHRzLnNsdWdGcm9tLCAoc2x1Z0Zyb20pIC0+XG4gICAgICAgIGNvbnQgPSB0cnVlIGlmIHN0cmluZ1RvTmVzdGVkKGRvYywgc2x1Z0Zyb20pIHx8IG1vZGlmaWVyLiRzZXRbc2x1Z0Zyb21dPyB8fCBzdHJpbmdUb05lc3RlZChtb2RpZmllci4kc2V0LCBzbHVnRnJvbSlcbiAgICAgIGlmICFjb250XG4gICAgICAgIGZzRGVidWcob3B0cyxcIm5vIHNsdWdGcm9tIGZpZWxkcyBhcmUgcHJlc2VudCAoZWl0aGVyIGJlZm9yZSBvciBhZnRlciB1cGRhdGUpLCBsZWF2aW5nLlwiKVxuICAgICAgICBjbGVhbk1vZGlmaWVyKClcbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgI1NlZSBpZiBhbnkgb2YgdGhlIHNsdWdGcm9tIGZpZWxkcyBoYXZlIGNoYW5nZWRcbiAgICAgIHNsdWdGcm9tQ2hhbmdlZCA9IGZhbHNlXG4gICAgICBfLmVhY2ggb3B0cy5zbHVnRnJvbSwgKHNsdWdGcm9tKSAtPlxuICAgICAgICBpZiBtb2RpZmllci4kc2V0W3NsdWdGcm9tXT8gfHwgc3RyaW5nVG9OZXN0ZWQobW9kaWZpZXIuJHNldCwgc2x1Z0Zyb20pXG4gICAgICAgICAgZG9jRnJvbSA9IHN0cmluZ1RvTmVzdGVkKGRvYywgc2x1Z0Zyb20pXG4gICAgICAgICAgaWYgKGRvY0Zyb20gaXNudCBtb2RpZmllci4kc2V0W3NsdWdGcm9tXSkgYW5kIChkb2NGcm9tIGlzbnQgc3RyaW5nVG9OZXN0ZWQobW9kaWZpZXIuJHNldCwgc2x1Z0Zyb20pKVxuICAgICAgICAgICAgc2x1Z0Zyb21DaGFuZ2VkID0gdHJ1ZVxuXG4gICAgICBmc0RlYnVnKG9wdHMsc2x1Z0Zyb21DaGFuZ2VkLCdzbHVnRnJvbUNoYW5nZWQnKVxuXG4gICAgICAjSXMgdGhlIHNsdWcgbWlzc2luZyAvIElzIHRoaXMgYW4gZXhpc3RpbmcgaXRlbSB3ZSBoYXZlIGFkZGVkIGEgc2x1ZyB0bz8gQU5EIGFyZSB3ZSBzdXBwb3NlZCB0byBjcmVhdGUgYSBzbHVnIG9uIHVwZGF0ZT9cbiAgICAgIGlmICFzdHJpbmdUb05lc3RlZChkb2MsIG9wdHMuc2x1Z0ZpZWxkKSBhbmQgb3B0cy5jcmVhdGVPblVwZGF0ZVxuICAgICAgICBmc0RlYnVnKG9wdHMsJ1VwZGF0ZTogU2x1ZyBGaWVsZCBpcyBtaXNzaW5nIGFuZCBjcmVhdGVPblVwZGF0ZSBpcyBzZXQgdG8gdHJ1ZScpXG5cbiAgICAgICAgaWYgc2x1Z0Zyb21DaGFuZ2VkXG4gICAgICAgICAgZnNEZWJ1ZyhvcHRzLCdzbHVnRnJvbSBmaWVsZCBoYXMgY2hhbmdlZCwgcnVuU2x1ZyB3aXRoIG1vZGlmaWVyJylcbiAgICAgICAgICBydW5TbHVnKGRvYywgb3B0cywgbW9kaWZpZXIpXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAjUnVuIHRoZSBzbHVnIHRvIGNyZWF0ZVxuICAgICAgICAgIGZzRGVidWcob3B0cywncnVuU2x1ZyB0byBjcmVhdGUnKVxuICAgICAgICAgIHJ1blNsdWcoZG9jLCBvcHRzLCBtb2RpZmllciwgdHJ1ZSlcbiAgICAgICAgICBjbGVhbk1vZGlmaWVyKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICBlbHNlXG4gICAgICAgICMgRG9uJ3QgY2hhbmdlIGFueXRoaW5nIG9uIHVwZGF0ZSBpZiB1cGRhdGVTbHVnIGlzIGZhbHNlXG4gICAgICAgIGlmIG9wdHMudXBkYXRlU2x1Zz8oZG9jLCBtb2RpZmllcikgaXMgZmFsc2VcbiAgICAgICAgICBmc0RlYnVnKG9wdHMsJ3VwZGF0ZVNsdWcgaXMgZmFsc2UsIG5vdGhpbmcgdG8gZG8uJylcbiAgICAgICAgICBjbGVhbk1vZGlmaWVyKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgICNEb24ndCBkbyBhbnl0aGluZyBpZiB0aGUgc2x1ZyBmcm9tIGZpZWxkIGhhcyBub3QgY2hhbmdlZFxuICAgICAgICBpZiAhc2x1Z0Zyb21DaGFuZ2VkXG4gICAgICAgICAgZnNEZWJ1ZyhvcHRzLCdzbHVnRnJvbSBmaWVsZCBoYXMgbm90IGNoYW5nZWQsIG5vdGhpbmcgdG8gZG8uJylcbiAgICAgICAgICBjbGVhbk1vZGlmaWVyKClcbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuXG4gICAgICAgIHJ1blNsdWcoZG9jLCBvcHRzLCBtb2RpZmllcilcblxuICAgICAgICBjbGVhbk1vZGlmaWVyKClcbiAgICAgICAgcmV0dXJuIHRydWVcblxuICAgICAgY2xlYW5Nb2RpZmllcigpXG4gICAgICByZXR1cm4gdHJ1ZVxuICAgIHJldHVyblxuICBydW5TbHVnID0gKGRvYywgb3B0cywgbW9kaWZpZXIgPSBmYWxzZSwgY3JlYXRlID0gZmFsc2UpIC0+XG4gICAgZnNEZWJ1ZyhvcHRzLCdCZWdpbiBydW5TbHVnJylcbiAgICBmc0RlYnVnKG9wdHMsb3B0cywnT3B0aW9ucycpXG4gICAgZnNEZWJ1ZyhvcHRzLG1vZGlmaWVyLCAnTW9kaWZpZXInKVxuICAgIGZzRGVidWcob3B0cyxjcmVhdGUsJ0NyZWF0ZScpXG5cbiAgICBjb21iaW5lRnJvbSA9IChkb2MsIGZpZWxkcywgbW9kaWZpZXJEb2MpIC0+XG4gICAgICBmcm9tVmFsdWVzID0gW11cbiAgICAgIF8uZWFjaCBmaWVsZHMsIChmKSAtPlxuICAgICAgICBpZiBtb2RpZmllckRvYz9cbiAgICAgICAgICBpZiBzdHJpbmdUb05lc3RlZChtb2RpZmllckRvYywgZilcbiAgICAgICAgICAgIHZhbCA9IHN0cmluZ1RvTmVzdGVkKG1vZGlmaWVyRG9jLCBmKVxuICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgIHZhbCA9IHN0cmluZ1RvTmVzdGVkKGRvYywgZilcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHZhbCA9IHN0cmluZ1RvTmVzdGVkKGRvYywgZilcbiAgICAgICAgZnJvbVZhbHVlcy5wdXNoKHZhbCkgaWYgdmFsXG4gICAgICByZXR1cm4gZmFsc2UgaWYgZnJvbVZhbHVlcy5sZW5ndGggPT0gMFxuICAgICAgcmV0dXJuIGZyb21WYWx1ZXMuam9pbignLScpXG5cbiAgICBmcm9tID0gaWYgY3JlYXRlIG9yICFtb2RpZmllciB0aGVuIGNvbWJpbmVGcm9tKGRvYywgb3B0cy5zbHVnRnJvbSkgZWxzZSBjb21iaW5lRnJvbShkb2MsIG9wdHMuc2x1Z0Zyb20sIG1vZGlmaWVyLiRzZXQpXG5cbiAgICBpZiBmcm9tID09IGZhbHNlXG4gICAgICBmc0RlYnVnKG9wdHMsXCJOb3RoaW5nIHRvIHNsdWcgZnJvbSwgbGVhdmluZy5cIilcbiAgICAgIHJldHVybiB0cnVlXG5cbiAgICBmc0RlYnVnKG9wdHMsZnJvbSwnU2x1Z2dpbmcgRnJvbScpXG5cbiAgICBzbHVnQmFzZSA9IHNsdWdpZnkoZnJvbSwgb3B0cy50cmFuc2xpdGVyYXRpb24sIG9wdHMubWF4TGVuZ3RoKVxuICAgIHJldHVybiBmYWxzZSBpZiAhc2x1Z0Jhc2VcblxuICAgIGZzRGVidWcob3B0cyxzbHVnQmFzZSwnU2x1Z0Jhc2UgYmVmb3JlIHJlZHVjdGlvbicpXG5cbiAgICBpZiBvcHRzLmRpc3RpbmN0XG5cbiAgICAgICMgQ2hlY2sgdG8gc2VlIGlmIHRoaXMgYmFzZSBoYXMgYSAtWzAtOTk5OS4uLl0gYXQgdGhlIGVuZCwgcmVkdWNlIHRvIGEgcmVhbCBiYXNlXG4gICAgICBzbHVnQmFzZSA9IHNsdWdCYXNlLnJlcGxhY2UoLygtXFxkKykrJC8sJycpXG4gICAgICBmc0RlYnVnKG9wdHMsc2x1Z0Jhc2UsJ1NsdWdCYXNlIGFmdGVyIHJlZHVjdGlvbicpXG5cbiAgICAgIGJhc2VGaWVsZCA9IFwiZnJpZW5kbHlTbHVncy5cIiArIG9wdHMuc2x1Z0ZpZWxkICsgXCIuYmFzZVwiXG4gICAgICBpbmRleEZpZWxkID0gXCJmcmllbmRseVNsdWdzLlwiICsgb3B0cy5zbHVnRmllbGQgKyBcIi5pbmRleFwiXG5cbiAgICAgIGZpZWxkU2VsZWN0b3IgPSB7fVxuICAgICAgZmllbGRTZWxlY3RvcltiYXNlRmllbGRdID0gc2x1Z0Jhc2VcblxuICAgICAgaSA9IDBcbiAgICAgIHdoaWxlIGkgPCBvcHRzLmRpc3RpbmN0VXBUby5sZW5ndGhcbiAgICAgICAgZiA9IG9wdHMuZGlzdGluY3RVcFRvW2ldXG4gICAgICAgIGZpZWxkU2VsZWN0b3JbZl0gPSBkb2NbZl1cbiAgICAgICAgaSsrXG5cbiAgICAgIHNvcnRTZWxlY3RvciA9IHt9XG4gICAgICBzb3J0U2VsZWN0b3JbaW5kZXhGaWVsZF0gPSAtMVxuXG4gICAgICBsaW1pdFNlbGVjdG9yID0ge31cbiAgICAgIGxpbWl0U2VsZWN0b3JbaW5kZXhGaWVsZF0gPSAxXG5cbiAgICAgIHJlc3VsdCA9IGNvbGxlY3Rpb24uZmluZE9uZShmaWVsZFNlbGVjdG9yLFxuICAgICAgICBzb3J0OiBzb3J0U2VsZWN0b3JcbiAgICAgICAgZmllbGRzOiBsaW1pdFNlbGVjdG9yXG4gICAgICAgIGxpbWl0OjFcbiAgICAgIClcblxuICAgICAgZnNEZWJ1ZyhvcHRzLHJlc3VsdCwnSGlnaGVzdCBpbmRleGVkIGJhc2UgZm91bmQnKVxuXG4gICAgICBpZiAhcmVzdWx0PyB8fCAhcmVzdWx0LmZyaWVuZGx5U2x1Z3M/IHx8ICFyZXN1bHQuZnJpZW5kbHlTbHVnc1tvcHRzLnNsdWdGaWVsZF0/IHx8ICFyZXN1bHQuZnJpZW5kbHlTbHVnc1tvcHRzLnNsdWdGaWVsZF0uaW5kZXg/XG4gICAgICAgIGluZGV4ID0gMFxuICAgICAgZWxzZVxuICAgICAgICBpbmRleCA9IHJlc3VsdC5mcmllbmRseVNsdWdzW29wdHMuc2x1Z0ZpZWxkXS5pbmRleCArIDFcblxuICAgICAgZGVmYXVsdFNsdWdHZW5lcmF0b3IgPSAoc2x1Z0Jhc2UsIGluZGV4KSAtPlxuICAgICAgICBpZiBpbmRleCBpcyAwIHRoZW4gc2x1Z0Jhc2UgZWxzZSBzbHVnQmFzZSArICctJyArIGluZGV4XG5cbiAgICAgIHNsdWdHZW5lcmF0b3IgPSBvcHRzLnNsdWdHZW5lcmF0b3IgPyBkZWZhdWx0U2x1Z0dlbmVyYXRvclxuXG4gICAgICBmaW5hbFNsdWcgPSBzbHVnR2VuZXJhdG9yKHNsdWdCYXNlLCBpbmRleClcblxuICAgIGVsc2VcbiAgICAgICNOb3QgZGlzdGluY3QsIGp1c3Qgc2V0IHRoZSBiYXNlXG4gICAgICBpbmRleCA9IGZhbHNlXG4gICAgICBmaW5hbFNsdWcgPSBzbHVnQmFzZVxuXG4gICAgZnNEZWJ1ZyhvcHRzLGZpbmFsU2x1ZywnZmluYWxTbHVnJylcblxuICAgIGlmIG1vZGlmaWVyIG9yIGNyZWF0ZVxuICAgICAgZnNEZWJ1ZyhvcHRzLCdTZXQgdG8gbW9kaWZ5IG9yIGNyZWF0ZSBzbHVnIG9uIHVwZGF0ZScpXG4gICAgICBtb2RpZmllciA9IG1vZGlmaWVyIHx8IHt9XG4gICAgICBtb2RpZmllci4kc2V0ID0gbW9kaWZpZXIuJHNldCB8fCB7fVxuICAgICAgbW9kaWZpZXIuJHNldC5mcmllbmRseVNsdWdzID0gZG9jLmZyaWVuZGx5U2x1Z3MgfHwge31cbiAgICAgIG1vZGlmaWVyLiRzZXQuZnJpZW5kbHlTbHVnc1tvcHRzLnNsdWdGaWVsZF0gPSBtb2RpZmllci4kc2V0LmZyaWVuZGx5U2x1Z3Nbb3B0cy5zbHVnRmllbGRdIHx8IHt9XG4gICAgICBtb2RpZmllci4kc2V0LmZyaWVuZGx5U2x1Z3Nbb3B0cy5zbHVnRmllbGRdLmJhc2UgPSBzbHVnQmFzZVxuICAgICAgbW9kaWZpZXIuJHNldC5mcmllbmRseVNsdWdzW29wdHMuc2x1Z0ZpZWxkXS5pbmRleCA9IGluZGV4XG4gICAgICBtb2RpZmllci4kc2V0W29wdHMuc2x1Z0ZpZWxkXSA9IGZpbmFsU2x1Z1xuICAgICAgZnNEZWJ1ZyhvcHRzLG1vZGlmaWVyLCdGaW5hbCBNb2RpZmllcicpXG5cbiAgICBlbHNlXG4gICAgICBmc0RlYnVnKG9wdHMsJ1NldCB0byB1cGRhdGUnKVxuICAgICAgZG9jLmZyaWVuZGx5U2x1Z3MgPSBkb2MuZnJpZW5kbHlTbHVncyB8fCB7fVxuICAgICAgZG9jLmZyaWVuZGx5U2x1Z3Nbb3B0cy5zbHVnRmllbGRdID0gZG9jLmZyaWVuZGx5U2x1Z3Nbb3B0cy5zbHVnRmllbGRdIHx8IHt9XG4gICAgICBkb2MuZnJpZW5kbHlTbHVnc1tvcHRzLnNsdWdGaWVsZF0uYmFzZSA9IHNsdWdCYXNlXG4gICAgICBkb2MuZnJpZW5kbHlTbHVnc1tvcHRzLnNsdWdGaWVsZF0uaW5kZXggPSBpbmRleFxuICAgICAgZG9jW29wdHMuc2x1Z0ZpZWxkXSA9IGZpbmFsU2x1Z1xuICAgICAgZnNEZWJ1ZyhvcHRzLGRvYywnRmluYWwgRG9jJylcbiAgICByZXR1cm4gdHJ1ZVxuXG4gIGZzRGVidWcgPSAob3B0cywgaXRlbSwgbGFiZWwgPSAnJyktPlxuICAgIHJldHVybiBpZiAhb3B0cy5kZWJ1Z1xuICAgIGlmIHR5cGVvZiBpdGVtIGlzICdvYmplY3QnXG4gICAgICBjb25zb2xlLmxvZyBcImZyaWVuZGx5U2x1Z3MgREVCVUc6IFwiICsgbGFiZWwgKyAn4oaTJ1xuICAgICAgY29uc29sZS5sb2cgaXRlbVxuICAgIGVsc2VcbiAgICAgIGNvbnNvbGUubG9nIFwiZnJpZW5kbHlTbHVncyBERUJVRzogXCIgKyBsYWJlbCArICc9ICcgKyBpdGVtXG5cbnNsdWdpZnkgPSAodGV4dCwgdHJhbnNsaXRlcmF0aW9uLCBtYXhMZW5ndGgpIC0+XG4gIHJldHVybiBmYWxzZSBpZiAhdGV4dD9cbiAgcmV0dXJuIGZhbHNlIGlmIHRleHQubGVuZ3RoIDwgMVxuICB0ZXh0ID0gdGV4dC50b1N0cmluZygpLnRvTG93ZXJDYXNlKClcbiAgXy5lYWNoIHRyYW5zbGl0ZXJhdGlvbiwgKGl0ZW0pLT5cbiAgICB0ZXh0ID0gdGV4dC5yZXBsYWNlKG5ldyBSZWdFeHAoJ1snK2l0ZW0uZnJvbSsnXScsJ2cnKSxpdGVtLnRvKVxuICBzbHVnID0gdGV4dFxuICAgIC5yZXBsYWNlKC8nL2csICcnKSAgICAgICAgICAgICAgIyBSZW1vdmUgYWxsIGFwb3N0cm9waGVzXG4gICAgLnJlcGxhY2UoL1teMC05YS16LV0vZywgJy0nKSAgICAjIFJlcGxhY2UgYW55dGhpbmcgdGhhdCBpcyBub3QgMC05LCBhLXosIG9yIC0gd2l0aCAtXG4gICAgLnJlcGxhY2UoL1xcLVxcLSsvZywgJy0nKSAgICAgICAgICMgUmVwbGFjZSBtdWx0aXBsZSAtIHdpdGggc2luZ2xlIC1cbiAgICAucmVwbGFjZSgvXi0rLywgJycpICAgICAgICAgICAgICMgVHJpbSAtIGZyb20gc3RhcnQgb2YgdGV4dFxuICAgIC5yZXBsYWNlKC8tKyQvLCAnJyk7ICAgICAgICAgICAgIyBUcmltIC0gZnJvbSBlbmQgb2YgdGV4dFxuICBpZiBtYXhMZW5ndGggPiAwICYmIHNsdWcubGVuZ3RoID4gbWF4TGVuZ3RoXG4gICAgbGFzdERhc2ggPSBzbHVnLnN1YnN0cmluZygwLG1heExlbmd0aCkubGFzdEluZGV4T2YoJy0nKVxuICAgIHNsdWcgPSBzbHVnLnN1YnN0cmluZygwLGxhc3REYXNoKVxuICByZXR1cm4gc2x1Z1xuXG5zdHJpbmdUb05lc3RlZCA9IChvYmosIHBhdGgpIC0+XG4gIHBhcnRzID0gcGF0aC5zcGxpdChcIi5cIilcbiAgaWYgcGFydHMubGVuZ3RoPT0xXG4gICAgaWYgb2JqPyAmJiBvYmpbcGFydHNbMF1dP1xuICAgICAgcmV0dXJuIG9ialtwYXJ0c1swXV1cbiAgICBlbHNlXG4gICAgICByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIHN0cmluZ1RvTmVzdGVkKG9ialtwYXJ0c1swXV0sIHBhcnRzLnNsaWNlKDEpLmpvaW4oXCIuXCIpKVxuIl19
