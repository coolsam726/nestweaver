import {
  DateTimeColumn,
  IdColumn,
  NumberField,
  RelationColumn,
  RelationField,
  Resource,
  Schema,
  SelectField,
  Table,
  TextColumn,
  TextField,
  TextareaField,
  InfolistBuilder,
  KanbanBuilder,
  Action,
  CreateAction,
  ViewAction,
  EditAction,
  DeleteAction,
} from '@nodeweaver/loom';

export abstract class PickingResourceBase extends Resource {
  static override slug = 'stock-pickings';
  static override label = 'Transfers';
  static override singularLabel = 'Transfer';
  static override icon = 'truck';
  static override navigationGroup = 'Inventory';
  static override navigationSection = 'Operations';
  static override navigationSort = 1;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override permissions() {
    return [
      { name: 'validate', label: 'Validate transfers' },
      { name: 'confirm', label: 'Confirm transfers' },
    ];
  }

  static override form(schema: Schema) {
    schema
      .section('identity', 'Transfer')
      .columns(2)
      .fields(
        TextField.make('name').searchable().placeholder('Auto'),
        SelectField.make('pickingType')
          .label('Type')
          .options([
            { label: 'Receipt', value: 'incoming' },
            { label: 'Delivery', value: 'outgoing' },
            { label: 'Internal', value: 'internal' },
          ]),
        RelationField.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        RelationField.make('locationId')
          .manyToOne('stock-locations', 'name')
          .label('Source location'),
        RelationField.make('locationDestId')
          .manyToOne('stock-locations', 'name')
          .label('Destination'),
        SelectField.make('state')
          .label('Status')
          .options([
            { label: 'Draft', value: 'draft' },
            { label: 'Confirmed', value: 'confirmed' },
            { label: 'Ready', value: 'assigned' },
            { label: 'Done', value: 'done' },
            { label: 'Cancelled', value: 'cancel' },
          ]),
        TextField.make('origin').label('Source document'),
        TextareaField.make('note').label('Notes').columnSpanFull(),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        TextColumn.make('pickingType').label('Type').sortable(),
        RelationColumn.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        TextColumn.make('state').sortable(),
        TextColumn.make('origin'),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('createdAt', 'desc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Transfer')
      .entries(
        TextColumn.make('name'),
        TextColumn.make('pickingType').label('Type'),
        RelationColumn.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        RelationColumn.make('locationId').manyToOne('stock-locations', 'name').label('Source'),
        RelationColumn.make('locationDestId')
          .manyToOne('stock-locations', 'name')
          .label('Destination'),
        TextColumn.make('state'),
        TextColumn.make('origin'),
        TextColumn.make('note'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }

  static override kanban(kanban: KanbanBuilder) {
    return kanban
      .title('Transfers')
      .groupBy('state')
      .columns('draft', 'confirmed', 'assigned', 'done', 'cancel')
      .card('name', 'pickingType')
      .fields('partnerId', 'origin')
      .build();
  }

  static override headerActions() {
    return [CreateAction.make()];
  }

  static override recordActions() {
    return [
      ViewAction.make(),
      EditAction.make(),
      Action.make('confirm')
        .label('Confirm')
        .color('primary')
        .method('POST')
        .ability('confirm')
        .confirm('Confirm this transfer?'),
      Action.make('assign')
        .label('Check availability')
        .method('POST')
        .ability('confirm'),
      Action.make('validate')
        .label('Validate')
        .color('accent')
        .method('POST')
        .ability('validate')
        .confirm('Validate and update stock?'),
      Action.make('cancel')
        .label('Cancel')
        .color('danger')
        .method('POST')
        .confirm('Cancel this transfer?'),
      DeleteAction.make(),
    ];
  }
}

export abstract class MoveResourceBase extends Resource {
  static override slug = 'stock-moves';
  static override label = 'Stock moves';
  static override singularLabel = 'Stock move';
  static override icon = 'arrow-right';
  static override navigationGroup = 'Inventory';
  static override navigationSection = 'Operations';
  static override navigationSort = 2;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Move')
      .columns(2)
      .fields(
        TextField.make('name').searchable(),
        RelationField.make('pickingId').manyToOne('stock-pickings', 'name').label('Transfer'),
        RelationField.make('productId').manyToOne('products', 'name').label('Product').required(),
        NumberField.make('productUomQty').label('Demand').required(),
        NumberField.make('quantityDone').label('Done'),
        RelationField.make('locationId').manyToOne('stock-locations', 'name').label('From'),
        RelationField.make('locationDestId').manyToOne('stock-locations', 'name').label('To'),
        RelationField.make('lotId').manyToOne('stock-lots', 'name').label('Lot/Serial'),
        NumberField.make('priceUnit').label('Unit cost'),
        SelectField.make('state')
          .label('Status')
          .options([
            { label: 'Draft', value: 'draft' },
            { label: 'Confirmed', value: 'confirmed' },
            { label: 'Ready', value: 'assigned' },
            { label: 'Done', value: 'done' },
            { label: 'Cancelled', value: 'cancel' },
          ]),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        RelationColumn.make('pickingId').manyToOne('stock-pickings', 'name').label('Transfer'),
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
        TextColumn.make('productUomQty').label('Demand').sortable(),
        TextColumn.make('quantityDone').label('Done').sortable(),
        TextColumn.make('state').sortable(),
      )
      .defaultSort('id', 'desc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Move')
      .entries(
        TextColumn.make('name'),
        RelationColumn.make('pickingId').manyToOne('stock-pickings', 'name').label('Transfer'),
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
        TextColumn.make('productUomQty').label('Demand'),
        TextColumn.make('quantityDone').label('Done'),
        RelationColumn.make('locationId').manyToOne('stock-locations', 'name').label('From'),
        RelationColumn.make('locationDestId').manyToOne('stock-locations', 'name').label('To'),
        TextColumn.make('state'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }
}
