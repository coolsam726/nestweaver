import {
  Action,
  CreateAction,
  DateTimeColumn,
  DeleteAction,
  EditAction,
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
  InfolistBuilder,
  ViewAction,
} from '@nodeweaver/loom';

export abstract class PaymentResourceBase extends Resource {
  static override slug = 'account-payments';
  static override label = 'Payments';
  static override singularLabel = 'Payment';
  static override icon = 'credit-card';
  static override navigationGroup = 'Accounting';
  static override navigationSection = 'Customers';
  static override navigationSort = 20;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override permissions() {
    return [{ name: 'post', label: 'Post payments' }];
  }

  static override form(schema: Schema) {
    schema
      .section('identity', 'Payment')
      .columns(2)
      .fields(
        TextField.make('name').searchable().placeholder('Auto'),
        RelationField.make('partnerId').manyToOne('partners', 'name').label('Partner').required(),
        SelectField.make('paymentType')
          .label('Type')
          .options([
            { label: 'Receive', value: 'inbound' },
            { label: 'Send', value: 'outbound' },
          ]),
        NumberField.make('amount').label('Amount').required(),
        RelationField.make('journalId')
          .manyToOne('account-journals', 'name')
          .label('Journal'),
        RelationField.make('invoiceId')
          .manyToOne('account-invoices', 'name')
          .label('Invoice'),
        TextField.make('paymentDate').label('Date').placeholder('YYYY-MM-DD'),
        SelectField.make('state')
          .label('Status')
          .options([
            { label: 'Draft', value: 'draft' },
            { label: 'Posted', value: 'posted' },
            { label: 'Cancelled', value: 'cancel' },
          ]),
        RelationField.make('moveId').manyToOne('account-moves', 'name').label('Journal entry'),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        RelationColumn.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        TextColumn.make('paymentType').label('Type').sortable(),
        TextColumn.make('amount').sortable(),
        RelationColumn.make('invoiceId').manyToOne('account-invoices', 'name').label('Invoice'),
        TextColumn.make('state').sortable(),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('createdAt', 'desc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Payment')
      .entries(
        TextColumn.make('name'),
        RelationColumn.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        TextColumn.make('paymentType').label('Type'),
        TextColumn.make('amount'),
        RelationColumn.make('journalId').manyToOne('account-journals', 'name').label('Journal'),
        RelationColumn.make('invoiceId').manyToOne('account-invoices', 'name').label('Invoice'),
        TextColumn.make('paymentDate'),
        TextColumn.make('state'),
        RelationColumn.make('moveId').manyToOne('account-moves', 'name').label('Journal entry'),
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
        .confirm('Post this payment?'),
      DeleteAction.make(),
    ];
  }
}
