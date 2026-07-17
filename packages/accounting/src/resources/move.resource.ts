import {
  Action,
  CreateAction,
  DateTimeColumn,
  DeleteAction,
  EditAction,
  IdColumn,
  RelationColumn,
  RelationField,
  Resource,
  Schema,
  SelectField,
  Table,
  TextColumn,
  TextField,
  InfolistBuilder,
  ViewAction,
} from '@nodeweaver/loom';

export abstract class AccountMoveResourceBase extends Resource {
  static override slug = 'account-moves';
  static override label = 'Journal entries';
  static override singularLabel = 'Journal entry';
  static override icon = 'file-text';
  static override navigationGroup = 'Accounting';
  static override navigationSection = 'Accounting';
  static override navigationSort = 10;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override permissions() {
    return [
      { name: 'post', label: 'Post journal entries' },
      { name: 'reverse', label: 'Reverse journal entries' },
    ];
  }

  static override form(schema: Schema) {
    schema
      .section('identity', 'Entry')
      .columns(2)
      .fields(
        TextField.make('name').searchable().placeholder('Auto'),
        TextField.make('ref').label('Reference').searchable(),
        RelationField.make('journalId')
          .manyToOne('account-journals', 'name')
          .label('Journal')
          .required(),
        TextField.make('date').label('Date').placeholder('YYYY-MM-DD'),
        RelationField.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        SelectField.make('state')
          .label('Status')
          .options([
            { label: 'Draft', value: 'draft' },
            { label: 'Posted', value: 'posted' },
            { label: 'Cancelled', value: 'cancel' },
          ]),
        TextField.make('sourceModel').label('Source model'),
        TextField.make('sourceId').label('Source id'),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        TextColumn.make('ref').searchable(),
        RelationColumn.make('journalId')
          .manyToOne('account-journals', 'name')
          .label('Journal'),
        TextColumn.make('date').sortable(),
        TextColumn.make('state').sortable(),
        RelationColumn.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('createdAt', 'desc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Entry')
      .entries(
        TextColumn.make('name'),
        TextColumn.make('ref'),
        RelationColumn.make('journalId')
          .manyToOne('account-journals', 'name')
          .label('Journal'),
        TextColumn.make('date'),
        TextColumn.make('state'),
        RelationColumn.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        TextColumn.make('sourceModel'),
        TextColumn.make('sourceId'),
        DateTimeColumn.make('createdAt'),
      )
      .build();
  }

  static override headerActions() {
    return [CreateAction.make()];
  }

  static override recordActions() {
    return [
      ViewAction.make(),
      EditAction.make(),
      Action.make('post')
        .label('Post')
        .color('accent')
        .method('POST')
        .ability('post')
        .confirm('Post this journal entry?'),
      Action.make('reverse')
        .label('Reverse')
        .method('POST')
        .ability('reverse')
        .confirm('Create a reversing entry?'),
      DeleteAction.make(),
    ];
  }
}

export abstract class AccountMoveLineResourceBase extends Resource {
  static override slug = 'account-move-lines';
  static override label = 'Journal items';
  static override singularLabel = 'Journal item';
  static override icon = 'list';
  static override navigationGroup = 'Accounting';
  static override navigationSection = 'Accounting';
  static override navigationSort = 11;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Line')
      .columns(2)
      .fields(
        RelationField.make('moveId')
          .manyToOne('account-moves', 'name')
          .label('Entry')
          .required(),
        RelationField.make('accountId').manyToOne('accounts', 'name').label('Account').required(),
        RelationField.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        TextField.make('name').searchable(),
        TextField.make('debit').label('Debit'),
        TextField.make('credit').label('Credit'),
        RelationField.make('productId').manyToOne('products', 'name').label('Product'),
        RelationField.make('taxId').manyToOne('taxes', 'name').label('Tax'),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        RelationColumn.make('moveId').manyToOne('account-moves', 'name').label('Entry'),
        RelationColumn.make('accountId').manyToOne('accounts', 'name').label('Account'),
        TextColumn.make('name').searchable(),
        TextColumn.make('debit').sortable(),
        TextColumn.make('credit').sortable(),
      )
      .defaultSort('id', 'desc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Line')
      .entries(
        RelationColumn.make('moveId').manyToOne('account-moves', 'name').label('Entry'),
        RelationColumn.make('accountId').manyToOne('accounts', 'name').label('Account'),
        TextColumn.make('name'),
        TextColumn.make('debit'),
        TextColumn.make('credit'),
        RelationColumn.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
      )
      .build();
  }
}
