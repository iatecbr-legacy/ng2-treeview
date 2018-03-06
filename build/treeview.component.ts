import { Component, Input, Output, EventEmitter, SimpleChanges, OnChanges, TemplateRef } from '@angular/core';
import * as _ from 'lodash';
import { TreeviewI18n } from './treeview-i18n';
import { TreeviewItem, TreeviewSelection } from './treeview-item';
import { TreeviewConfig } from './treeview-config';
import { TreeviewEventParser } from './treeview-event-parser';
import { TreeviewHeaderTemplateContext } from './treeview-header-template-context';
import { TreeviewItemTemplateContext } from './treeview-item-template-context';

class FilterTreeviewItem extends TreeviewItem {
    private readonly refItem: TreeviewItem;
    constructor(item: TreeviewItem) {
        super({
            text: item.text,
            value: item.value,
            disabled: item.disabled,
            checked: item.checked,
            collapsed: item.collapsed,
            children: item.children,
            color: item.color
        });
        this.refItem = item;
    }

    updateRefChecked() {
        this.children.forEach(child => {
            if (child instanceof FilterTreeviewItem) {
                child.updateRefChecked();
            }
        });

        let refChecked = this.checked;
        if (refChecked) {
            for (const refChild of this.refItem.children) {
                if (!refChild.checked) {
                    refChecked = false;
                    break;
                }
            }
        }
        this.refItem.checked = refChecked;
    }
}

@Component({
    selector: 'treeview',
    template: `
      <ng-template #defaultItemTemplate let-item="item" let-onCollapseExpand="onCollapseExpand" let-onCheckedChange="onCheckedChange">
          <div class="form-check" >
              <i *ngIf="item.children" (click)="onCollapseExpand()" aria-hidden="true" class="fa" [class.fa-caret-right]="item.collapsed"
                  [class.fa-caret-down]="!item.collapsed"></i>
              <label class="form-check-label" [ngStyle]="{'color': showColor ? item.color : ''}">
                  <input type="checkbox" class="form-check-input" *ngIf="item.children"
                      [(ngModel)]="item.checked" (ngModelChange)="onCheckedChange()" [disabled]="item.disabled || isBusy" [indeterminate]="item.indeterminate" />
                  {{item.text}}
              </label>
              <input type="checkbox" class="form-check-input pull-right" *ngIf="!item.children"
                  [(ngModel)]="item.checked" (ngModelChange)="onCheckedChange()" [disabled]="item.disabled || isBusy" [indeterminate]="item.indeterminate" />
              <input type="checkbox" class="form-check-input pull-right" *ngIf="item.children"
                  [(ngModel)]="item.outChecked" (ngModelChange)="onCheckedFatherChange()" [disabled]="item.disabled || isBusy" />
          </div>
      </ng-template>
      <ng-template #defaultHeaderTemplate let-config="config" let-item="item" let-onCollapseExpand="onCollapseExpand" let-onCheckedChange="onCheckedChange"
          let-onFilterTextChange="onFilterTextChange">
          <div *ngIf="config.hasFilter" class="row row-filter">
              <div class="col-12">
                  <input class="form-control" type="text" [placeholder]="i18n.getFilterPlaceholder()" [(ngModel)]="filterText" (ngModelChange)="onFilterTextChange($event)" [disabled]="isBusy"
                  />
              </div>
          </div>
          <div *ngIf="hasFilterItems">
              <div *ngIf="config.hasAllCheckBox || config.hasCollapseExpand" class="row">
                  <div class="col-12">
                      <label *ngIf="config.hasAllCheckBox" class="form-check-label">
                          <input type="checkbox" class="form-check-input"
                              [(ngModel)]="item.checked" (ngModelChange)="onCheckedChange($event)" [indeterminate]="item.indeterminate" />
                              {{i18n.getAllCheckboxText()}}
                      </label>
                      <label *ngIf="config.hasCollapseExpand" class="pull-right form-check-label" (click)="onCollapseExpand()">
                          <i [title]="i18n.getTooltipCollapseExpandText(item.collapsed)" aria-hidden="true"
                              class="fa" [class.fa-expand]="item.collapsed" [class.fa-compress]="!item.collapsed"></i>
                      </label>
                  </div>
              </div>
              <div *ngIf="config.hasDivider" class="dropdown-divider"></div>
          </div>
      </ng-template>
      <div class="treeview-header">
          <ng-template [ngTemplateOutlet]="headerTemplate || defaultHeaderTemplate" [ngTemplateOutletContext]="headerTemplateContext">
          </ng-template>
      </div>
      <div [ngSwitch]="hasFilterItems">
          <div *ngSwitchCase="true" class="treeview-container" [style.max-height.px]="maxHeight">
              <treeview-item *ngFor="let item of filterItems" [config]="config" [item]="item" [template]="itemTemplate || defaultItemTemplate"
                  (checkedChange)="onItemCheckedChange(item, $event)">
              </treeview-item>
          </div>
          <div *ngSwitchCase="false" class="treeview-text">
              {{i18n.getFilterNoItemsFoundText()}}
          </div>
      </div>
    `,
    styles: [`
      :host /deep/ {
          .treeview-header {
              .row-filter {
                  margin-bottom: .5rem;
              }
          }
          .treeview-container {
              .fa {
                  width: .8rem;
                  cursor: pointer;
              }
          }
      }

      .treeview-container {
          overflow-x: hidden;
          overflow-y: auto;
          padding-right: 18px;
      }

      .treeview-text {
          padding: .3rem 0;
          white-space: nowrap;
      }

      .form-check {
          vertical-align: middle;
      }

      .form-check:hover {
          background-color: #e2e2e2;
      }

      .form-check-input {
          margin-right: 5px;
      }
    `]
})
export class TreeviewComponent implements OnChanges {
    @Input() headerTemplate: TemplateRef<TreeviewHeaderTemplateContext>;
    @Input() itemTemplate: TemplateRef<TreeviewItemTemplateContext>;
    @Input() items: TreeviewItem[];
    @Input() config: TreeviewConfig;
    @Input() isBusy: boolean;
    @Input() showColor: boolean = false;
    @Output() selectedChange = new EventEmitter<any[]>();
    headerTemplateContext: TreeviewHeaderTemplateContext;
    allItem: TreeviewItem;
    filterText = '';
    filterItems: TreeviewItem[];
    selection: TreeviewSelection;

    constructor(
        public i18n: TreeviewI18n,
        private defaultConfig: TreeviewConfig,
        private eventParser: TreeviewEventParser
    ) {
        this.config = this.defaultConfig;
        this.allItem = new TreeviewItem({ text: 'All', value: undefined, color: '#4d4d4d' });
        this.createHeaderTemplateContext();
    }

    get hasFilterItems(): boolean {
        return !_.isNil(this.filterItems) && this.filterItems.length > 0;
    }

    get maxHeight(): string {
        return `${this.config.maxHeight}`;
    }

    ngOnChanges(changes: SimpleChanges) {
        const itemsSimpleChange = changes['items'];
        if (!_.isNil(itemsSimpleChange)) {
            if (!_.isNil(this.items)) {
                this.updateFilterItems();
                this.updateCollapsedOfAll();
                this.raiseSelectedChange();
            }
        }
        this.createHeaderTemplateContext();
    }

    onAllCollapseExpand() {
        this.allItem.collapsed = !this.allItem.collapsed;
        this.filterItems.forEach(item => item.setCollapsedRecursive(this.allItem.collapsed));
    }

    onFilterTextChange(text: string) {
        this.filterText = text;
        this.updateFilterItems();
    }

    onAllCheckedChange(checked: boolean) {
        this.filterItems.forEach(item => {
            item.setCheckedRecursive(checked);
            if (item instanceof FilterTreeviewItem) {
                item.updateRefChecked();
            }
        });

        this.raiseSelectedChange();
    }

    onCheckedFatherChange(){
        this.raiseSelectedChange();
    }

    onItemCheckedChange(item: TreeviewItem, checked: boolean) {
        if (item instanceof FilterTreeviewItem) {
            item.updateRefChecked();
        }

        this.updateCheckedOfAll();
        this.raiseSelectedChange();
    }

    raiseSelectedChange() {
        this.generateSelection();
        const values = this.eventParser.getSelectedChange(this);
        this.selectedChange.emit(values);
    }

    private createHeaderTemplateContext() {
        this.headerTemplateContext = {
            config: this.config,
            item: this.allItem,
            onCheckedChange: (checked) => this.onAllCheckedChange(checked),
            onCollapseExpand: () => {if(!this.isBusy){this.onAllCollapseExpand()}},
            onFilterTextChange: (text) => this.onFilterTextChange(text)
        };
    }

    private generateSelection() {
        let checkedItems: TreeviewItem[] = [];
        let uncheckedItems: TreeviewItem[] = [];
        if (!_.isNil(this.items)) {
            for (const item of this.items) {
                const selection = item.getSelection();
                checkedItems = _.concat(checkedItems, selection.checkedItems);
                uncheckedItems = _.concat(uncheckedItems, selection.uncheckedItems);
            }
        }

        this.selection = {
            checkedItems: checkedItems,
            uncheckedItems: uncheckedItems
        };
    }

    private updateFilterItems() {
        if (this.filterText !== '') {
            const filterItems: TreeviewItem[] = [];
            const filterText = this.filterText.toLowerCase();
            this.items.forEach(item => {
                const newItem = this.filterItem(item, filterText);
                if (!_.isNil(newItem)) {
                    filterItems.push(newItem);
                }
            });
            this.filterItems = filterItems;
        } else {
            this.filterItems = this.items;
        }

        this.updateCheckedOfAll();
    }

    private filterItem(item: TreeviewItem, filterText: string): TreeviewItem {
        const isMatch = _.includes(item.text.toLowerCase(), filterText);
        if (isMatch) {
            return item;
        } else {
            if (!_.isNil(item.children)) {
                const children: TreeviewItem[] = [];
                item.children.forEach(child => {
                    const newChild = this.filterItem(child, filterText);
                    if (!_.isNil(newChild)) {
                        children.push(newChild);
                    }
                });
                if (children.length > 0) {
                    const newItem = new FilterTreeviewItem(item);
                    newItem.collapsed = false;
                    newItem.children = children;
                    return newItem;
                }
            }
        }

        return undefined;
    }

    private updateCheckedOfAll() {                
        let itemChecked: boolean = null;
        for (const filterItem of this.filterItems) {
            if (itemChecked === null) {
                itemChecked = filterItem.checked;
            } else if (itemChecked !== filterItem.checked) {
                itemChecked = undefined;
                break;
            }
        }

        if (itemChecked === null) {
            itemChecked = false;
        }

        this.allItem.checked = itemChecked;
    }

    private updateCollapsedOfAll() {
        let hasItemExpanded = false;
        for (const filterItem of this.filterItems) {
            if (!filterItem.collapsed) {
                hasItemExpanded = true;
                break;
            }
        }

        this.allItem.collapsed = !hasItemExpanded;
    }
}
