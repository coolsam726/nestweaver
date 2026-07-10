import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { groupKanbanRecords } from '../core/resource.js';
import { buildListViews, showListViewSwitcher, type ListViewId, type ListViewQuery } from '../core/list-views.js';
import { buildPaginationContext, normalizeListQuery } from '../core/list-query.js';
import { buildBrandingCss } from '../core/branding.js';
import type { ResourceMeta, SortDirection } from '../core/types.js';
import { loomAdminCssPath, loomUiJsPath } from './paths.js';
import { LoomService } from './loom.service.js';
import { LoomViewService } from './loom-view.service.js';

export function createLoomController(basePath = '/admin'): new (...args: never[]) => object {
  const route = basePath.replace(/^\//, '') || 'admin';

  @Controller(route)
  class LoomController {
    constructor(
      private readonly loom: LoomService,
      private readonly views: LoomViewService,
    ) {}

    @Get('assets/branding.css')
    @Header('Content-Type', 'text/css; charset=utf-8')
    @Header('Cache-Control', 'no-cache')
    brandingCss(): string {
      return buildBrandingCss(this.loom.branding);
    }

    @Get('assets/loom-ui.js')
    @Header('Content-Type', 'application/javascript; charset=utf-8')
    @Header('Cache-Control', 'no-cache')
    loomUi(): string {
      return readFileSync(loomUiJsPath(), 'utf8');
    }

    @Get('assets/admin.css')
    @Header('Content-Type', 'text/css; charset=utf-8')
    @Header('Cache-Control', 'no-cache')
    adminCss(): string {
      return readFileSync(loomAdminCssPath(), 'utf8');
    }

    @Get()
    @Header('Content-Type', 'text/html; charset=utf-8')
    dashboard(@Query('success') success?: string, @Query('error') error?: string): string {
      return this.views.render('dashboard', shellContext(this.loom, {
        pageTitle: 'Dashboard',
        pageSubtitle: 'Select an application to get started.',
        flash: flashFromQuery(success, error),
      }));
    }

    @Get(':resource/kanban')
    @Header('Content-Type', 'text/html; charset=utf-8')
    async kanban(
      @Param('resource') resource: string,
      @Query('search') search?: string,
      @Query('success') success?: string,
      @Query('error') error?: string,
    ): Promise<string> {
      const meta = this.loom.meta(resource);
      if (!meta.kanban) {
        const result = await this.loom.list(resource, { page: 1, perPage: 100, search });
        return this.views.render('list', shellContext(this.loom, {
          currentSlug: resource,
          pageTitle: meta.label,
          pageSubtitle: `${result.total} records`,
          showCreateButton: true,
          resource: meta,
          result,
          query: { search },
          ...listViewContext(this.loom, meta, 'table', { search }),
        }));
      }
      const result = await this.loom.list(resource, {
        page: 1,
        perPage: meta.kanban.groupBy ? 500 : 100,
        search,
      });
      const columns = groupKanbanRecords(result.items, meta.kanban.groupBy);
      return this.views.render('kanban', shellContext(this.loom, {
        currentSlug: resource,
        pageTitle: meta.kanban.title ?? meta.label,
        pageSubtitle: 'Kanban view',
        showCreateButton: true,
        resource: meta,
        kanban: meta.kanban,
        columns,
        query: { search },
        flash: flashFromQuery(success, error),
        ...listViewContext(this.loom, meta, 'kanban', { search }),
      }));
    }

    @Get(':resource')
    @Header('Content-Type', 'text/html; charset=utf-8')
    async list(
      @Param('resource') resource: string,
      @Query('page') page = '1',
      @Query('perPage') perPage = '15',
      @Query('search') search?: string,
      @Query('sort') sort?: string,
      @Query('direction') direction?: SortDirection,
      @Query('success') success?: string,
      @Query('error') error?: string,
    ): Promise<string> {
      const meta = this.loom.meta(resource);
      const query = normalizeListQuery({ page, perPage, search, sort, direction });
      const result = await this.loom.list(resource, query);
      return this.views.render('list', shellContext(this.loom, {
        currentSlug: resource,
        pageTitle: meta.label,
        pageSubtitle: `${result.total} records`,
        showCreateButton: true,
        resource: meta,
        result,
        query,
        pagination: buildPaginationContext(this.loom.basePath, resource, query, result),
        flash: flashFromQuery(success, error),
        ...listViewContext(this.loom, meta, 'table', query),
      }));
    }

    @Get(':resource/create')
    @Header('Content-Type', 'text/html; charset=utf-8')
    createForm(
      @Param('resource') resource: string,
      @Query('embed') embed?: string,
      @Query('success') success?: string,
      @Query('error') error?: string,
    ): string {
      const meta = this.loom.meta(resource);
      const context = shellContext(this.loom, {
        currentSlug: resource,
        pageTitle: `Create ${meta.singularLabel}`,
        resource: meta,
        record: {},
        mode: 'create',
        readonly: false,
        embed: embed === '1',
        flash: flashFromQuery(success, error),
      });
      return this.views.render('form', context, embed === '1' ? { layout: 'bare' } : undefined);
    }

    @Post(':resource')
    @Redirect()
    async create(
      @Param('resource') resource: string,
      @Body() body: Record<string, unknown>,
    ): Promise<{ url: string; statusCode: number }> {
      try {
        await this.loom.create(resource, body);
        return {
          url: `${this.loom.basePath}/${resource}?success=created`,
          statusCode: 302,
        };
      } catch (error) {
        const message = encodeURIComponent(
          error instanceof Error ? error.message : 'Create failed',
        );
        return {
          url: `${this.loom.basePath}/${resource}/create?error=${message}`,
          statusCode: 302,
        };
      }
    }

    @Get(':resource/:id/edit')
    @Header('Content-Type', 'text/html; charset=utf-8')
    async editForm(
      @Param('resource') resource: string,
      @Param('id') id: string,
      @Query('success') success?: string,
      @Query('error') error?: string,
      @Query('embed') embed?: string,
    ): Promise<string> {
      const meta = this.loom.meta(resource);
      const record = await this.loom.findOne(resource, id);
      const context = shellContext(this.loom, {
        currentSlug: resource,
        pageTitle: `Edit ${meta.singularLabel}`,
        resource: meta,
        record,
        recordTitle: this.loom.recordTitle(meta, record),
        mode: 'edit',
        id,
        readonly: false,
        embed: embed === '1',
        flash: flashFromQuery(success, error),
      });
      return this.views.render('form', context, embed === '1' ? { layout: 'bare' } : undefined);
    }

    @Get(':resource/:id')
    @Header('Content-Type', 'text/html; charset=utf-8')
    async detail(
      @Param('resource') resource: string,
      @Param('id') id: string,
      @Query('success') success?: string,
      @Query('error') error?: string,
      @Query('embed') embed?: string,
    ): Promise<string> {
      const meta = this.loom.meta(resource);
      const record = await this.loom.findOne(resource, id);
      const pageTitle = this.loom.recordTitle(meta, record);
      const context = shellContext(this.loom, {
        currentSlug: resource,
        pageTitle,
        showEditButton: !embed,
        showBackToList: !embed,
        resource: meta,
        record,
        recordTitle: pageTitle,
        id,
        embed: embed === '1',
        flash: flashFromQuery(success, error),
      });
      if (!meta.hasExplicitDetail) {
        return this.views.render(
          'form',
          { ...context, mode: 'view', readonly: true },
          embed === '1' ? { layout: 'bare' } : undefined,
        );
      }
      return this.views.render('detail', context, embed === '1' ? { layout: 'bare' } : undefined);
    }

    @Post(':resource/:id')
    @Redirect()
    async update(
      @Param('resource') resource: string,
      @Param('id') id: string,
      @Body() body: Record<string, unknown>,
    ): Promise<{ url: string; statusCode: number }> {
      try {
        await this.loom.update(resource, id, body);
        return {
          url: `${this.loom.basePath}/${resource}/${id}?success=updated`,
          statusCode: 302,
        };
      } catch (error) {
        const message = encodeURIComponent(
          error instanceof Error ? error.message : 'Update failed',
        );
        return {
          url: `${this.loom.basePath}/${resource}/${id}/edit?error=${message}`,
          statusCode: 302,
        };
      }
    }

    @Post(':resource/:id/delete')
    @Redirect()
    async remove(
      @Param('resource') resource: string,
      @Param('id') id: string,
    ): Promise<{ url: string; statusCode: number }> {
      try {
        await this.loom.delete(resource, id);
        return {
          url: `${this.loom.basePath}/${resource}?success=deleted`,
          statusCode: 302,
        };
      } catch (error) {
        const message = encodeURIComponent(
          error instanceof Error ? error.message : 'Delete failed',
        );
        return {
          url: `${this.loom.basePath}/${resource}?error=${message}`,
          statusCode: 302,
        };
      }
    }
  }

  return LoomController;
}

function listViewContext(
  loom: LoomService,
  meta: ResourceMeta,
  currentView: ListViewId,
  query: ListViewQuery = {},
) {
  const listViews = buildListViews(meta, loom.basePath, currentView, query);
  return {
    listViews,
    currentListView: currentView,
    showListViewSwitcher: showListViewSwitcher(listViews),
  };
}

function shellContext(
  loom: LoomService,
  extra: Record<string, unknown> & {
    currentSlug?: string;
    pageTitle?: string;
    resource?: ResourceMeta;
  },
): Record<string, unknown> {
  const pageTitle = (extra.pageTitle as string | undefined) ?? loom.panelTitle;
  const menu = loom.menuContext(extra.currentSlug, pageTitle);
  const companies = loom.companies;
  const currentCompanyId = loom.currentCompanyId;
  const currentCompany = companies.find((c) => c.id === currentCompanyId);
  return {
    title: pageTitle,
    pageTitle,
    panelTitle: loom.panelTitle,
    basePath: loom.basePath,
    branding: loom.branding,
    navGroups: loom.navigationGroups(),
    companies,
    currentCompanyId,
    currentCompanyName: currentCompany?.name,
    user: loom.user,
    userInitial: loom.userInitial(),
    ...menu,
    ...extra,
  };
}

function flashFromQuery(
  success?: string,
  error?: string,
): { type: 'success' | 'error'; message: string } | undefined {
  if (success) {
    const message =
      success === 'created'
        ? 'Record created.'
        : success === 'updated'
          ? 'Record updated.'
          : success === 'deleted'
            ? 'Record deleted.'
            : success;
    return { type: 'success', message };
  }
  if (error) {
    return { type: 'error', message: error };
  }
  return undefined;
}
