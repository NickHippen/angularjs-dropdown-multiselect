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
                template += '<button type="button" class="dropdown-toggle" ng-class="dropdownMultiselect.settings.buttonClasses" ng-click="dropdownMultiselect.toggleDropdown()">{{dropdownMultiselect.getButtonText()}}&nbsp;<span class="caret"></span></button>';
                template += '<ul class="dropdown-menu dropdown-menu-form" ng-style="{display: dropdownMultiselect.open ? \'block\' : \'none\', height : dropdownMultiselect.settings.scrollable ? dropdownMultiselect.settings.scrollableHeight : \'auto\' }" style="overflow: scroll" >';
                template += '<li ng-hide="!dropdownMultiselect.settings.showCheckAll || dropdownMultiselect.settings.selectionLimit > 0"><a data-ng-click="dropdownMultiselect.selectAll()"><span class="glyphicon glyphicon-ok"></span>  {{dropdownMultiselect.texts.checkAll}}</a>';
                template += '<li ng-show="dropdownMultiselect.settings.showUncheckAll"><a data-ng-click="dropdownMultiselect.deselectAll();"><span class="glyphicon glyphicon-remove"></span>   {{dropdownMultiselect.texts.uncheckAll}}</a></li>';
                template += '<li ng-hide="(!dropdownMultiselect.settings.showCheckAll || dropdownMultiselect.settings.selectionLimit > 0) && !dropdownMultiselect.settings.showUncheckAll" class="divider"></li>';
                template += '<li ng-show="dropdownMultiselect.settings.enableSearch"><div class="dropdown-header"><input type="text" class="form-control" style="width: 100%;" ng-model="dropdownMultiselect.searchFilter" placeholder="{{dropdownMultiselect.texts.searchPlaceholder}}" /></li>';
                template += '<li ng-show="dropdownMultiselect.settings.enableSearch" class="divider"></li>';

                if (groups) {
                    template += '<li ng-repeat-start="option in dropdownMultiselect.orderedItems | filter: dropdownMultiselect.searchFilter" ng-show="dropdownMultiselect.getPropertyForObject(option, dropdownMultiselect.settings.groupBy) !== dropdownMultiselect.getPropertyForObject(dropdownMultiselect.orderedItems[$index - 1], dropdownMultiselect.settings.groupBy)" role="presentation" class="dropdown-header">{{ dropdownMultiselect.getGroupTitle(dropdownMultiselect.getPropertyForObject(option, dropdownMultiselect.settings.groupBy)) }}</li>';
                    template += '<li ng-repeat-end role="presentation">';
                } else {
                    template += '<li role="presentation" ng-repeat="option in dropdownMultiselect.options | filter: dropdownMultiselect.searchFilter">';
                }

                template += '<a role="menuitem" tabindex="-1" ng-click="dropdownMultiselect.setSelectedItem(dropdownMultiselect.getPropertyForObject(option,dropdownMultiselect.settings.idProp))">';

                if (checkboxes) {
                    template += '<div class="checkbox"><label><input class="checkboxInput" type="checkbox" ng-click="dropdownMultiselect.checkboxClick($event, dropdownMultiselect.getPropertyForObject(option,dropdownMultiselect.settings.idProp))" ng-checked="dropdownMultiselect.isChecked(dropdownMultiselect.getPropertyForObject(option,dropdownMultiselect.settings.idProp))" /> {{dropdownMultiselect.getPropertyForObject(option, dropdownMultiselect.settings.displayProp)}}</label></div></a>';
                } else {
                    template += '<span data-ng-class="{\'glyphicon glyphicon-ok\': dropdownMultiselect.isChecked(dropdownMultiselect.getPropertyForObject(option,dropdownMultiselect.settings.idProp))}"></span> {{dropdownMultiselect.getPropertyForObject(option, dropdownMultiselect.settings.displayProp)}}</a>';
                }

                template += '</li>';

                template += '<li class="divider" ng-show="dropdownMultiselect.settings.selectionLimit > 1"></li>';
                template += '<li role="presentation" ng-show="dropdownMultiselect.settings.selectionLimit > 1"><a role="menuitem">{{dropdownMultiselect.selectedModel.length}} {{dropdownMultiselect.texts.selectionOf}} {{dropdownMultiselect.settings.selectionLimit}} {{dropdownMultiselect.texts.selectionCount}}</a></li>';

                template += '</ul>';
                template += '</div>';

                element.html(template);
            },
            controller: function($scope, $element) {
                var dropdownMultiselect = this;
                var $dropdownTrigger = $element.children()[0];
                
                dropdownMultiselect.toggleDropdown = function () {
                    dropdownMultiselect.open = !dropdownMultiselect.open;
                };

                dropdownMultiselect.checkboxClick = function ($event, id) {
                    dropdownMultiselect.setSelectedItem(id);
                    $event.stopImmediatePropagation();
                };

                dropdownMultiselect.externalEvents = {
                    onItemSelect: angular.noop,
                    onItemDeselect: angular.noop,
                    onSelectAll: angular.noop,
                    onDeselectAll: angular.noop,
                    onInitDone: angular.noop,
                    onMaxSelectionReached: angular.noop
                };

                dropdownMultiselect.settings = {
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
                    groupBy: dropdownMultiselect.groupBy || undefined,
                    groupByTextProvider: null,
                    smartButtonMaxItems: 0,
                    smartButtonTextConverter: angular.noop
                };

                dropdownMultiselect.texts = {
                    checkAll: 'Check All',
                    uncheckAll: 'Uncheck All',
                    selectionCount: 'checked',
                    selectionOf: '/',
                    searchPlaceholder: 'Search...',
                    buttonDefaultText: 'Select',
                    dynamicButtonTextSuffix: 'checked'
                };

                dropdownMultiselect.searchFilter = dropdownMultiselect.searchFilter || '';
                
                if (angular.isDefined(dropdownMultiselect.settings.groupBy)) {
                    $scope.$watch('options', function (newValue) {
                        if (angular.isDefined(newValue)) {
                            dropdownMultiselect.orderedItems = $filter('orderBy')(newValue, dropdownMultiselect.settings.groupBy);
                        }
                    });
                }

                angular.extend(dropdownMultiselect.settings, dropdownMultiselect.extraSettings || []);
                angular.extend(dropdownMultiselect.externalEvents, dropdownMultiselect.events || []);
                angular.extend(dropdownMultiselect.texts, dropdownMultiselect.translationTexts);

                dropdownMultiselect.singleSelection = dropdownMultiselect.settings.selectionLimit === 1;

                function getFindObj(id) {
                    var findObj = {};

                    if (dropdownMultiselect.settings.externalIdProp === '') {
                        findObj[dropdownMultiselect.settings.idProp] = id;
                    } else {
                        findObj[dropdownMultiselect.settings.externalIdProp] = id;
                    }

                    return findObj;
                }

                function clearObject(object) {
                    for (var prop in object) {
                        delete object[prop];
                    }
                }

                if (dropdownMultiselect.singleSelection) {
                    if (angular.isArray(dropdownMultiselect.selectedModel) && dropdownMultiselect.selectedModel.length === 0) {
                        clearObject(dropdownMultiselect.selectedModel);
                    }
                }

                if (dropdownMultiselect.settings.closeOnBlur) {
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
                                dropdownMultiselect.open = false;
                            });
                        }
                    });
                }

                dropdownMultiselect.getGroupTitle = function (groupValue) {
                    if (dropdownMultiselect.settings.groupByTextProvider !== null) {
                        return dropdownMultiselect.settings.groupByTextProvider(groupValue);
                    }

                    return groupValue;
                };

                dropdownMultiselect.getButtonText = function () {
                    if (dropdownMultiselect.settings.dynamicTitle && (dropdownMultiselect.selectedModel.length > 0 || (angular.isObject(dropdownMultiselect.selectedModel) && _.keys(dropdownMultiselect.selectedModel).length > 0))) {
                        if (dropdownMultiselect.settings.smartButtonMaxItems > 0) {
                            var itemsText = [];

                            angular.forEach(dropdownMultiselect.options, function (optionItem) {
                                if (dropdownMultiselect.isChecked(dropdownMultiselect.getPropertyForObject(optionItem, dropdownMultiselect.settings.idProp))) {
                                    var displayText = dropdownMultiselect.getPropertyForObject(optionItem, dropdownMultiselect.settings.displayProp);
                                    var converterResponse = dropdownMultiselect.settings.smartButtonTextConverter(displayText, optionItem);

                                    itemsText.push(converterResponse ? converterResponse : displayText);
                                }
                            });

                            if (dropdownMultiselect.selectedModel.length > dropdownMultiselect.settings.smartButtonMaxItems) {
                                itemsText = itemsText.slice(0, dropdownMultiselect.settings.smartButtonMaxItems);
                                itemsText.push('...');
                            }

                            return itemsText.join(', ');
                        } else {
                            var totalSelected;

                            if (dropdownMultiselect.singleSelection) {
                                totalSelected = (dropdownMultiselect.selectedModel !== null && angular.isDefined(dropdownMultiselect.selectedModel[dropdownMultiselect.settings.idProp])) ? 1 : 0;
                            } else {
                                totalSelected = angular.isDefined(dropdownMultiselect.selectedModel) ? dropdownMultiselect.selectedModel.length : 0;
                            }

                            if (totalSelected === 0) {
                                return dropdownMultiselect.texts.buttonDefaultText;
                            } else {
                                return totalSelected + ' ' + dropdownMultiselect.texts.dynamicButtonTextSuffix;
                            }
                        }
                    } else {
                        return dropdownMultiselect.texts.buttonDefaultText;
                    }
                };

                dropdownMultiselect.getPropertyForObject = function (object, property) {
                    if (angular.isDefined(object) && object.hasOwnProperty(property)) {
                        return object[property];
                    }

                    return '';
                };

                dropdownMultiselect.selectAll = function () {
                    dropdownMultiselect.deselectAll(false);
                    dropdownMultiselect.externalEvents.onSelectAll();

                    angular.forEach(dropdownMultiselect.options, function (value) {
                        dropdownMultiselect.setSelectedItem(value[dropdownMultiselect.settings.idProp], true);
                    });
                };

                dropdownMultiselect.deselectAll = function (sendEvent) {
                    sendEvent = sendEvent || true;

                    if (sendEvent) {
                        dropdownMultiselect.externalEvents.onDeselectAll();
                    }

                    if (dropdownMultiselect.singleSelection) {
                        clearObject(dropdownMultiselect.selectedModel);
                    } else {
                        dropdownMultiselect.selectedModel.splice(0, dropdownMultiselect.selectedModel.length);
                    }
                };

                dropdownMultiselect.setSelectedItem = function (id, dontRemove) {
                    var findObj = getFindObj(id);
                    var finalObj = null;

                    if (dropdownMultiselect.settings.externalIdProp === '') {
                        finalObj = _.find(dropdownMultiselect.options, findObj);
                    } else {
                        finalObj = findObj;
                    }

                    if (dropdownMultiselect.singleSelection) {
                        clearObject(dropdownMultiselect.selectedModel);
                        angular.extend(dropdownMultiselect.selectedModel, finalObj);
                        dropdownMultiselect.externalEvents.onItemSelect(finalObj);
                        if (dropdownMultiselect.settings.closeOnSelect) dropdownMultiselect.open = false;

                        return;
                    }

                    dontRemove = dontRemove || false;

                    var exists = _.findIndex(dropdownMultiselect.selectedModel, findObj) !== -1;

                    if (!dontRemove && exists) {
                        dropdownMultiselect.selectedModel.splice(_.findIndex(dropdownMultiselect.selectedModel, findObj), 1);
                        dropdownMultiselect.externalEvents.onItemDeselect(findObj);
                    } else if (!exists && (dropdownMultiselect.settings.selectionLimit === 0 || dropdownMultiselect.selectedModel.length < dropdownMultiselect.settings.selectionLimit)) {
                        dropdownMultiselect.selectedModel.push(finalObj);
                        dropdownMultiselect.externalEvents.onItemSelect(finalObj);
                    }
                    if (dropdownMultiselect.settings.closeOnSelect) dropdownMultiselect.open = false;
                };

                dropdownMultiselect.isChecked = function (id) {
                    if (dropdownMultiselect.singleSelection) {
                        return dropdownMultiselect.selectedModel !== null && angular.isDefined(dropdownMultiselect.selectedModel[dropdownMultiselect.settings.idProp]) && dropdownMultiselect.selectedModel[dropdownMultiselect.settings.idProp] === getFindObj(id)[dropdownMultiselect.settings.idProp];
                    }

                    return _.findIndex(dropdownMultiselect.selectedModel, getFindObj(id)) !== -1;
                };

                dropdownMultiselect.externalEvents.onInitDone();
            },
            controllerAs: 'dropdownMultiselect',
            bindToController: true
        };
}]);
