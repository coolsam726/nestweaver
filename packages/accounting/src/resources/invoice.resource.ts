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
  TextareaField,
  InfolistBuilder,
  ViewAction,
} from '@nodeweaver/loom';

export abstract class InvoiceResourceBase extends Resource {
  static override slug = 'account-invoices';
  static override label = 'Invoices & bills';
  static override singularLabel = 'Invoice';
  static override icon = 'receipt';
  static override navigationGroup = 'Accounting';
  static override navigationSection = 'Customers';
  static override navigationSort = 1;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override permissions() {
    return [{ name: 'post', label: 'Post invoices' }];
  }

  static override form(schema: Schema) {
    schema
      .section('identity', 'Document')
      .columns(2)
      .fields(
        TextField.make('name').searchable().placeholder('Auto'),
        SelectField.make('moveType')
          .label('Type')
          .options([
            { label: 'Customer invoice', value: 'out_invoice' },
            { label: 'Customer credit note', value: 'out_refund' },
            { label: 'Vendor bill', value: 'in_invoice' },
            { label: 'Vendor credit note', value: 'in_refund' },
          ]),
        RelationField.make('partnerId').manyToOne('partners', 'name').label('Partner').required(),
        RelationField.make('journalId')
          .manyToOne('account-journals', 'name')
          .label('Journal'),
        TextField.make('invoiceDate').label('Invoice date').placeholder('YYYY-MM-DD'),
        SelectField.make('state')
          .label('Status')
          .options([
            { label: 'Draft', value: 'draft' },
            { label: 'Posted', value: 'posted' },
            { label: 'Paid', value: 'paid' },
            { label: 'Cancelled', value: 'cancel' },
          ]),
        NumberField.make('amountUntaxed').label('Untaxed'),
        NumberField.make('amountTax').label('Tax'),
        NumberField.make('amountTotal').label('Total'),
        NumberField.make('amountResidual').label('Residual'),
        RelationField.make('moveId').manyToOne('account-moves', 'name').label('Journal entry'),
        TextareaField.make('narrations').label('Notes').columnSpanFull(),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        TextColumn.make('name').searchable().sortable(),
        TextColumn.make('moveType').label('Type').sortable(),
        RelationColumn.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        TextColumn.make('invoiceDate').sortable(),
        TextColumn.make('amountTotal').label('Total').sortable(),
        TextColumn.make('amountResidual').label('Due').sortable(),
        TextColumn.make('state').sortable(),
        DateTimeColumn.make('createdAt').sortable(),
      )
      .defaultSort('createdAt', 'desc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Document')
      .entries(
        TextColumn.make('name'),
        TextColumn.make('moveType').label('Type'),
        RelationColumn.make('partnerId').manyToOne('partners', 'name').label('Partner'),
        TextColumn.make('invoiceDate'),
        TextColumn.make('amountUntaxed').label('Untaxed'),
        TextColumn.make('amountTax').label('Tax'),
        TextColumn.make('amountTotal').label('Total'),
        TextColumn.make('amountResidual').label('Due'),
        TextColumn.make('state'),
        RelationColumn.make('moveId').manyToOne('account-moves', 'name').label('Journal entry'),
        TextColumn.make('narrations'),
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
        .confirm('Post invoice and create journal entry?'),
      DeleteAction.make(),
    ];
  }
}

export abstract class InvoiceLineResourceBase extends Resource {
  static override slug = 'account-invoice-lines';
  static override label = 'Invoice lines';
  static override singularLabel = 'Invoice line';
  static override icon = 'list';
  static override navigationGroup = 'Accounting';
  static override navigationSection = 'Customers';
  static override navigationSort = 2;
  static override recordTitleField = 'name';
  static override companyScoped = true;

  static override form(schema: Schema) {
    schema
      .section('identity', 'Line')
      .columns(2)
      .fields(
        RelationField.make('invoiceId')
          .manyToOne('account-invoices', 'name')
          .label('Invoice')
          .required(),
        RelationField.make('productId').manyToOne('products', 'name').label('Product'),
        TextField.make('name').required().searchable(),
        NumberField.make('quantity').label('Qty'),
        NumberField.make('priceUnit').label('Unit price'),
        RelationField.make('accountId').manyToOne('accounts', 'name').label('Account'),
        NumberField.make('subtotal').label('Subtotal'),
      );
    return schema.build();
  }

  static override table(table: Table) {
    return table
      .columns(
        IdColumn.make(),
        RelationColumn.make('invoiceId').manyToOne('account-invoices', 'name').label('Invoice'),
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
        TextColumn.make('name').searchable(),
        TextColumn.make('quantity').sortable(),
        TextColumn.make('priceUnit').label('Unit price').sortable(),
        TextColumn.make('subtotal').sortable(),
      )
      .defaultSort('id', 'desc')
      .build();
  }

  static override detail(infolist: InfolistBuilder) {
    return infolist
      .section('identity', 'Line')
      .entries(
        RelationColumn.make('invoiceId').manyToOne('account-invoices', 'name').label('Invoice'),
        RelationColumn.make('productId').manyToOne('products', 'name').label('Product'),
        TextColumn.make('name'),
        TextColumn.make('quantity'),
        TextColumn.make('priceUnit').label('Unit price'),
        RelationColumn.make('accountId').manyToOne('accounts', 'name').label('Account'),
        TextColumn.make('subtotal'),
      )
      .build();
  }
}
