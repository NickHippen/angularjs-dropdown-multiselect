'use strict';

var directiveModule = angular.module('angularjs-dropdown-multiselect', []);

directiveModule.directive('ngDropdownMultiselect', ['$filter', '$document', '$compile', '$parse',
    function ($filter, $document, $compile, $parse) {

        return {
            restrict: 'AE',
            scope: {
                selectedModel: '=',
                options: '=',
                extraSettings: '=',
                events: '=',
                searchFilter: '=?',
                translationTexts: '=',
                groupBy: '@'
            },
            template: function (element, attrs) {
                var checkboxes = attrs.checkboxes ? true : false;
                var groups = attrs.groupBy ? true : false;

                var template = '<div class="multiselect-parent btn-group dropdown-multiselect">';
                template += '<button type="button" class="dropdown-toggle" ng-class="dm.settings.buttonClasses" ng-click="dm.toggleDropdown()">{{dm.getButtonText()}}&nbsp;<span class="caret"></span></button>';
                template += '<ul class="dropdown-menu dropdown-menu-form" ng-style="{display: dm.open ? \'block\' : \'none\', height : dm.settings.scrollable ? dm.settings.scrollableHeight : \'auto\' }" style="overflow: scroll" >';
                template += '<li ng-hide="!dm.settings.showCheckAll || dm.settings.selectionLimit > 0"><a data-ng-click="dm.selectAll()"><span class="glyphicon glyphicon-ok"></span>  {{dm.texts.checkAll}}</a>';
                template += '<li ng-show="dm.settings.showUncheckAll"><a data-ng-click="dm.deselectAll();"><span class="glyphicon glyphicon-remove"></span>   {{dm.texts.uncheckAll}}</a></li>';
                template += '<li ng-hide="(!dm.settings.showCheckAll || dm.settings.selectionLimit > 0) && !dm.settings.showUncheckAll" class="divider"></li>';
                template += '<li ng-show="dm.settings.enableSearch"><div class="dropdown-header"><input type="text" class="form-control" style="width: 100%;" ng-model="dm.searchFilter" placeholder="{{dm.texts.searchPlaceholder}}" /></li>';
                template += '<li ng-show="dm.settings.enableSearch" class="divider"></li>';

                if (groups) {
                    template += '<li ng-repeat-start="option in dm.orderedItems | filter: dm.searchFilter" ng-show="dm.getPropertyForObject(option, dm.settings.groupBy) !== dm.getPropertyForObject(dm.orderedItems[$index - 1], dm.settings.groupBy)" role="presentation" class="dropdown-header">{{ dm.getGroupTitle(dm.getPropertyForObject(option, dm.settings.groupBy)) }}</li>';
                    template += '<li ng-repeat-end role="presentation">';
                } else {
                    template += '<li role="presentation" ng-repeat="option in dm.options | filter: dm.searchFilter">';
                }

                template += '<a role="menuitem" tabindex="-1" ng-click="dm.setSelectedItem(dm.getPropertyForObject(option,dm.settings.idProp))">';

                if (checkboxes) {
                    template += '<div class="checkbox"><label><input class="checkboxInput" type="checkbox" ng-click="dm.checkboxClick($event, dm.getPropertyForObject(option,dm.settings.idProp))" ng-checked="dm.isChecked(dm.getPropertyForObject(option,dm.settings.idProp))" /> {{dm.getPropertyForObject(option, dm.settings.displayProp)}}</label></div></a>';
                } else {
                    template += '<span data-ng-class="{\'glyphicon glyphicon-ok\': dm.isChecked(dm.getPropertyForObject(option,dm.settings.idProp))}"></span> {{dm.getPropertyForObject(option, dm.settings.displayProp)}}</a>';
                }

                template += '</li>';

                template += '<li class="divider" ng-show="dm.settings.selectionLimit > 1"></li>';
                template += '<li role="presentation" ng-show="dm.settings.selectionLimit > 1"><a role="menuitem">{{dm.selectedModel.length}} {{dm.texts.selectionOf}} {{dm.settings.selectionLimit}} {{dm.texts.selectionCount}}</a></li>';

                template += '</ul>';
                template += '</div>';

                element.html(template);
            },
            controller: function($scope, $element) {
                var dm = this;
                var $dropdownTrigger = $element.children()[0];
                
                dm.toggleDropdown = function () {
                    dm.open = !dm.open;
                };

                dm.checkboxClick = function ($event, id) {
                    dm.setSelectedItem(id);
                    $event.stopImmediatePropagation();
                };

                dm.externalEvents = {
                    onItemSelect: angular.noop,
                    onItemDeselect: angular.noop,
                    onSelectAll: angular.noop,
                    onDeselectAll: angular.noop,
                    onInitDone: angular.noop,
                    onMaxSelectionReached: angular.noop
                };

                dm.settings = {
                    dynamicTitle: true,
                    scrollable: false,
                    scrollableHeight: '300px',
                    closeOnBlur: true,
                    displayProp: 'label',
                    idProp: 'id',
                    externalIdProp: 'id',
                    enableSearch: false,
                    selectionLimit: 0,
                    showCheckAll: true,
                    showUncheckAll: true,
                    closeOnSelect: false,
                    buttonClasses: 'btn btn-default',
                    closeOnDeselect: false,
                    groupBy: dm.groupBy || undefined,
                    groupByTextProvider: null,
                    smartButtonMaxItems: 0,
                    smartButtonTextConverter: angular.noop
                };

                dm.texts = {
                    checkAll: 'Check All',
                    uncheckAll: 'Uncheck All',
                    selectionCount: 'checked',
                    selectionOf: '/',
                    searchPlaceholder: 'Search...',
                    buttonDefaultText: 'Select',
                    dynamicButtonTextSuffix: 'checked'
                };

                dm.searchFilter = dm.searchFilter || '';
                
                if (angular.isDefined(dm.settings.groupBy)) {
                    $scope.$watch('options', function (newValue) {
                        if (angular.isDefined(newValue)) {
                            dm.orderedItems = $filter('orderBy')(newValue, dm.settings.groupBy);
                        }
                    });
                }

                angular.extend(dm.settings, dm.extraSettings || []);
                angular.extend(dm.externalEvents, dm.events || []);
                angular.extend(dm.texts, dm.translationTexts);

                dm.singleSelection = dm.settings.selectionLimit === 1;

                function getFindObj(id) {
                    var findObj = {};

                    if (dm.settings.externalIdProp === '') {
                        findObj[dm.settings.idProp] = id;
                    } else {
                        findObj[dm.settings.externalIdProp] = id;
                    }

                    return findObj;
                }

                function clearObject(object) {
                    for (var prop in object) {
                        delete object[prop];
                    }
                }

                if (dm.singleSelection) {
                    if (angular.isArray(dm.selectedModel) && dm.selectedModel.length === 0) {
                        clearObject(dm.selectedModel);
                    }
                }

                if (dm.settings.closeOnBlur) {
                    $document.on('click', function (e) {
                        var target = e.target.parentElement;
                        var parentFound = false;

                        while (angular.isDefined(target) && target !== null && !parentFound) {
                            if (_.contains(target.className.split(' '), 'multiselect-parent') && !parentFound) {
                                if(target === $dropdownTrigger) {
                                    parentFound = true;
                                }
                            }
                            target = target.parentElement;
                        }

                        if (!parentFound) {
                            $scope.$apply(function () {
                                dm.open = false;
                            });
                        }
                    });
                }

                dm.getGroupTitle = function (groupValue) {
                    if (dm.settings.groupByTextProvider !== null) {
                        return dm.settings.groupByTextProvider(groupValue);
                    }

                    return groupValue;
                };

                dm.getButtonText = function () {
                    if (dm.settings.dynamicTitle && (dm.selectedModel.length > 0 || (angular.isObject(dm.selectedModel) && _.keys(dm.selectedModel).length > 0))) {
                        if (dm.settings.smartButtonMaxItems > 0) {
                            var itemsText = [];

                            angular.forEach(dm.options, function (optionItem) {
                                if (dm.isChecked(dm.getPropertyForObject(optionItem, dm.settings.idProp))) {
                                    var displayText = dm.getPropertyForObject(optionItem, dm.settings.displayProp);
                                    var converterResponse = dm.settings.smartButtonTextConverter(displayText, optionItem);

                                    itemsText.push(converterResponse ? converterResponse : displayText);
                                }
                            });

                            if (dm.selectedModel.length > dm.settings.smartButtonMaxItems) {
                                itemsText = itemsText.slice(0, dm.settings.smartButtonMaxItems);
                                itemsText.push('...');
                            }

                            return itemsText.join(', ');
                        } else {
                            var totalSelected;

                            if (dm.singleSelection) {
                                totalSelected = (dm.selectedModel !== null && angular.isDefined(dm.selectedModel[dm.settings.idProp])) ? 1 : 0;
                            } else {
                                totalSelected = angular.isDefined(dm.selectedModel) ? dm.selectedModel.length : 0;
                            }

                            if (totalSelected === 0) {
                                return dm.texts.buttonDefaultText;
                            } else {
                                return totalSelected + ' ' + dm.texts.dynamicButtonTextSuffix;
                            }
                        }
                    } else {
                        return dm.texts.buttonDefaultText;
                    }
                };

                dm.getPropertyForObject = function (object, property) {
                    if (angular.isDefined(object) && object.hasOwnProperty(property)) {
                        return object[property];
                    }

                    return '';
                };

                dm.selectAll = function () {
                    dm.deselectAll(false);
                    dm.externalEvents.onSelectAll();

                    angular.forEach(dm.options, function (value) {
                        dm.setSelectedItem(value[dm.settings.idProp], true);
                    });
                };

                dm.deselectAll = function (sendEvent) {
                    sendEvent = sendEvent || true;

                    if (sendEvent) {
                        dm.externalEvents.onDeselectAll();
                    }

                    if (dm.singleSelection) {
                        clearObject(dm.selectedModel);
                    } else {
                        dm.selectedModel.splice(0, dm.selectedModel.length);
                    }
                };

                dm.setSelectedItem = function (id, dontRemove) {
                    var findObj = getFindObj(id);
                    var finalObj = null;

                    if (dm.settings.externalIdProp === '') {
                        finalObj = _.find(dm.options, findObj);
                    } else {
                        finalObj = findObj;
                    }

                    if (dm.singleSelection) {
                        clearObject(dm.selectedModel);
                        angular.extend(dm.selectedModel, finalObj);
                        dm.externalEvents.onItemSelect(finalObj);
                        if (dm.settings.closeOnSelect) dm.open = false;

                        return;
                    }

                    dontRemove = dontRemove || false;

                    var exists = _.findIndex(dm.selectedModel, findObj) !== -1;

                    if (!dontRemove && exists) {
                        dm.selectedModel.splice(_.findIndex(dm.selectedModel, findObj), 1);
                        dm.externalEvents.onItemDeselect(findObj);
                    } else if (!exists && (dm.settings.selectionLimit === 0 || dm.selectedModel.length < dm.settings.selectionLimit)) {
                        dm.selectedModel.push(finalObj);
                        dm.externalEvents.onItemSelect(finalObj);
                    }
                    if (dm.settings.closeOnSelect) dm.open = false;
                };

                dm.isChecked = function (id) {
                    if (dm.singleSelection) {
                        return dm.selectedModel !== null && angular.isDefined(dm.selectedModel[dm.settings.idProp]) && dm.selectedModel[dm.settings.idProp] === getFindObj(id)[dm.settings.idProp];
                    }

                    return _.findIndex(dm.selectedModel, getFindObj(id)) !== -1;
                };

                dm.externalEvents.onInitDone();
            },
            controllerAs: 'dm',
            bindToController: true
        };
}]);
