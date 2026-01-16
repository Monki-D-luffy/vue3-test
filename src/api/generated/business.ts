/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface AddProductFirmwareRequest {
  productId?: string | null;
  firmwaresRepoId?: string | null;
  releaseNote?: string | null;
}

export interface CheckForUpdateRequest {
  uuid?: string | null;
  /** @format int32 */
  target?: number;
}

export interface CreateDraftRequest {
  productId?: string | null;
  firmwaresRepoId?: string | null;
  firmwareVersion?: string | null;
  country?: string | null;
  /** @format int32 */
  upgradeMode?: number;
  releaseNote?: string | null;
  remark?: string | null;
}

export interface CreateFirmwaresRepoRequest {
  firmwaresRepoName?: string | null;
  /** @format int32 */
  firmwaresRepoType?: number;
  /** @format int32 */
  firmwaresRepoChannel?: number;
  /** @format int32 */
  updateTimeoutValue?: number;
  releaseNote?: string | null;
}

export interface CreateProductRequest {
  productName?: string | null;
  productType?: string | null;
  communicateType?: string | null;
  description?: string | null;
}

export interface DeviceLogsCountRequest {
  uuid?: string | null;
  /** @format int32 */
  dpid?: number | null;
  /** @format date-time */
  startTime?: string | null;
  /** @format date-time */
  endTime?: string | null;
}

export interface DeviceLogsQueryRequest {
  uuid?: string | null;
  /** @format int32 */
  dpid?: number | null;
  /** @format date-time */
  startTime?: string | null;
  /** @format date-time */
  endTime?: string | null;
  /** @format int32 */
  pageIndex?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface DevicesQueryRequest {
  country?: string | null;
  uuid?: string | null;
  productId?: string | null;
  /** @format int32 */
  onlineStatus?: number | null;
  /** @format int32 */
  bindStatus?: number | null;
  /** @format date-time */
  startTime?: string | null;
  /** @format date-time */
  endTime?: string | null;
  /** @format int32 */
  pageIndex?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface ProductDPInfoModel {
  productId?: string | null;
  /** @format int32 */
  dpId?: number;
  dpName?: string | null;
  dataType?: string | null;
  transType?: string | null;
  unit?: string | null;
  description?: string | null;
}

export interface ProductQueryRequest {
  productName?: string | null;
  productType?: string | null;
  /** @format int32 */
  pageIndex?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface PublishGrayRequest {
  otaTaskId?: string | null;
  /** @format int32 */
  grayPolicy?: number;
  /** @format int32 */
  grayValue?: number;
}

export interface QueryFirmwaresRepoRequest {
  firmwaresRepoName?: string | null;
  /** @format int32 */
  firmwaresRepoType?: number | null;
  /** @format int32 */
  pageIndex?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface QueryFirmwaresRequest {
  repoId?: string | null;
  /** @format int32 */
  pageIndex?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface QueryProductFirmwaresRequest {
  productId?: string | null;
  firmwaresRepoId?: string | null;
  /** @format int32 */
  pageIndex?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface QueryTaskDevicesRequest {
  otaTaskId?: string | null;
  /** @format int32 */
  status?: number | null;
  /** @format int32 */
  pageIndex?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface QueryTasksRequest {
  productId?: string | null;
  firmwaresRepoId?: string | null;
  firmwareVersion?: string | null;
  country?: string | null;
  /** @format int32 */
  status?: number | null;
  /** @format int32 */
  pageIndex?: number;
  /** @format int32 */
  pageSize?: number;
}

export interface SaveProductConfigRequest {
  productId?: string | null;
  productName?: string | null;
  productType?: string | null;
  description?: string | null;
  productImage?: string | null;
  dpList?: ProductDPInfoModel[] | null;
}

export interface StartOTARequest {
  uuid?: string | null;
  version?: string | null;
  firmwaresRepoId?: string | null;
}

export interface UpdateFirmwareRequest {
  repoId?: string | null;
  firmwareVersion?: string | null;
  /** @format int32 */
  mandatoryVersion?: number;
  releaseNote?: string | null;
}

export interface UpdateFirmwaresRepoRequest {
  firmwaresRepoId?: string | null;
  firmwaresRepoName?: string | null;
  /** @format int32 */
  firmwaresRepoType?: number;
  /** @format int32 */
  updateTimeoutValue?: number;
  releaseNote?: string | null;
}

export interface UpdateProductFirmwareRequest {
  productId?: string | null;
  firmwaresRepoId?: string | null;
  releaseNote?: string | null;
}

export interface UpdateTaskRequest {
  otaTaskId?: string | null;
  /** @format int32 */
  upgradeMode?: number;
  releaseNote?: string | null;
  remark?: string | null;
  country?: string | null;
}

export interface UsersCountRequest {
  country?: string | null;
  userID?: string | null;
  userName?: string | null;
  email?: string | null;
}

export interface UsersQueryRequest {
  country?: string | null;
  userID?: string | null;
  userName?: string | null;
  email?: string | null;
  /** @format int32 */
  pageIndex?: number;
  /** @format int32 */
  pageSize?: number;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title IdentityService API
 * @version v1
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  api = {
    /**
     * No description
     *
     * @tags DeviceLogs
     * @name DeviceLogsGetDeviceLogsTotalCountCreate
     * @request POST:/api/DeviceLogs/GetDeviceLogsTotalCount
     * @secure
     */
    deviceLogsGetDeviceLogsTotalCountCreate: (
      data: DeviceLogsCountRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/DeviceLogs/GetDeviceLogsTotalCount`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags DeviceLogs
     * @name DeviceLogsGetDeviceLogsCreate
     * @request POST:/api/DeviceLogs/GetDeviceLogs
     * @secure
     */
    deviceLogsGetDeviceLogsCreate: (
      data: DeviceLogsQueryRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/DeviceLogs/GetDeviceLogs`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Devices
     * @name DevicesGetDevicesTotalCountCreate
     * @request POST:/api/Devices/GetDevicesTotalCount
     * @secure
     */
    devicesGetDevicesTotalCountCreate: (
      query?: {
        country?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Devices/GetDevicesTotalCount`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Devices
     * @name DevicesGetDevicesCreate
     * @request POST:/api/Devices/GetDevices
     * @secure
     */
    devicesGetDevicesCreate: (
      data: DevicesQueryRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Devices/GetDevices`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Firmwares
     * @name FirmwaresAddFirmwareCreate
     * @request POST:/api/Firmwares/AddFirmware
     * @secure
     */
    firmwaresAddFirmwareCreate: (
      data: {
        repoId?: string;
        version?: string;
        /** @format int32 */
        mandatoryVersion?: number;
        releaseNote?: string;
        /** @format binary */
        file?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Firmwares/AddFirmware`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Firmwares
     * @name FirmwaresUpdateFirmwareCreate
     * @request POST:/api/Firmwares/UpdateFirmware
     * @secure
     */
    firmwaresUpdateFirmwareCreate: (
      data: UpdateFirmwareRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Firmwares/UpdateFirmware`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Firmwares
     * @name FirmwaresDeleteFirmwareCreate
     * @request POST:/api/Firmwares/DeleteFirmware
     * @secure
     */
    firmwaresDeleteFirmwareCreate: (
      query?: {
        repoId?: string;
        version?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Firmwares/DeleteFirmware`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Firmwares
     * @name FirmwaresQueryFirmwaresCreate
     * @request POST:/api/Firmwares/QueryFirmwares
     * @secure
     */
    firmwaresQueryFirmwaresCreate: (
      data: QueryFirmwaresRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Firmwares/QueryFirmwares`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Firmwares
     * @name FirmwaresFindFirmwareByVersionCreate
     * @request POST:/api/Firmwares/FindFirmwareByVersion
     * @secure
     */
    firmwaresFindFirmwareByVersionCreate: (
      query?: {
        repoId?: string;
        version?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Firmwares/FindFirmwareByVersion`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags FirmwaresRepo
     * @name FirmwaresRepoCreateFirmwaresRepoCreate
     * @request POST:/api/FirmwaresRepo/CreateFirmwaresRepo
     * @secure
     */
    firmwaresRepoCreateFirmwaresRepoCreate: (
      data: CreateFirmwaresRepoRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/FirmwaresRepo/CreateFirmwaresRepo`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags FirmwaresRepo
     * @name FirmwaresRepoUpdateFirmwaresRepoCreate
     * @request POST:/api/FirmwaresRepo/UpdateFirmwaresRepo
     * @secure
     */
    firmwaresRepoUpdateFirmwaresRepoCreate: (
      data: UpdateFirmwaresRepoRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/FirmwaresRepo/UpdateFirmwaresRepo`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags FirmwaresRepo
     * @name FirmwaresRepoDeleteFirmwaresRepoCreate
     * @request POST:/api/FirmwaresRepo/DeleteFirmwaresRepo
     * @secure
     */
    firmwaresRepoDeleteFirmwaresRepoCreate: (
      query?: {
        firmwaresRepoId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/FirmwaresRepo/DeleteFirmwaresRepo`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags FirmwaresRepo
     * @name FirmwaresRepoQueryFirmwaresReposCreate
     * @request POST:/api/FirmwaresRepo/QueryFirmwaresRepos
     * @secure
     */
    firmwaresRepoQueryFirmwaresReposCreate: (
      data: QueryFirmwaresRepoRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/FirmwaresRepo/QueryFirmwaresRepos`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags FirmwaresRepo
     * @name FirmwaresRepoFindFirmwaresRepoByIdCreate
     * @request POST:/api/FirmwaresRepo/FindFirmwaresRepoById
     * @secure
     */
    firmwaresRepoFindFirmwaresRepoByIdCreate: (
      query?: {
        firmwaresRepoId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/FirmwaresRepo/FindFirmwaresRepoById`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManageCreateDraftCreate
     * @request POST:/api/OTATaskManage/CreateDraft
     * @secure
     */
    otaTaskManageCreateDraftCreate: (
      data: CreateDraftRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/CreateDraft`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManageUpdateCreate
     * @request POST:/api/OTATaskManage/Update
     * @secure
     */
    otaTaskManageUpdateCreate: (
      data: UpdateTaskRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/Update`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManagePublishFullCreate
     * @request POST:/api/OTATaskManage/PublishFull
     * @secure
     */
    otaTaskManagePublishFullCreate: (
      query?: {
        otaTaskId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/PublishFull`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManagePublishGrayCreate
     * @request POST:/api/OTATaskManage/PublishGray
     * @secure
     */
    otaTaskManagePublishGrayCreate: (
      data: PublishGrayRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/PublishGray`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManagePausePublishCreate
     * @request POST:/api/OTATaskManage/PausePublish
     * @secure
     */
    otaTaskManagePausePublishCreate: (
      query?: {
        otaTaskId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/PausePublish`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManageDeleteCreate
     * @request POST:/api/OTATaskManage/Delete
     * @secure
     */
    otaTaskManageDeleteCreate: (
      query?: {
        otaTaskId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/Delete`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManageGetCreate
     * @request POST:/api/OTATaskManage/Get
     * @secure
     */
    otaTaskManageGetCreate: (
      query?: {
        otaTaskId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/Get`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManageQueryCreate
     * @request POST:/api/OTATaskManage/Query
     * @secure
     */
    otaTaskManageQueryCreate: (
      data: QueryTasksRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/Query`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManageVerifyAddCreate
     * @request POST:/api/OTATaskManage/Verify/Add
     * @secure
     */
    otaTaskManageVerifyAddCreate: (
      query?: {
        otaTaskId?: string;
        uuid?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/Verify/Add`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManageVerifyRemoveCreate
     * @request POST:/api/OTATaskManage/Verify/Remove
     * @secure
     */
    otaTaskManageVerifyRemoveCreate: (
      query?: {
        otaTaskId?: string;
        uuid?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/Verify/Remove`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManageVerifyQueryCreate
     * @request POST:/api/OTATaskManage/Verify/Query
     * @secure
     */
    otaTaskManageVerifyQueryCreate: (
      query?: {
        otaTaskId?: string;
        /** @format int32 */
        pageIndex?: number;
        /** @format int32 */
        pageSize?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/Verify/Query`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManageVerifyClearCreate
     * @request POST:/api/OTATaskManage/Verify/Clear
     * @secure
     */
    otaTaskManageVerifyClearCreate: (
      query?: {
        otaTaskId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/Verify/Clear`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATaskManage
     * @name OtaTaskManageDevicesQueryCreate
     * @request POST:/api/OTATaskManage/Devices/Query
     * @secure
     */
    otaTaskManageDevicesQueryCreate: (
      data: QueryTaskDevicesRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/OTATaskManage/Devices/Query`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATasks
     * @name OtaCheckForUpdateCreate
     * @request POST:/api/ota/CheckForUpdate
     * @secure
     */
    otaCheckForUpdateCreate: (
      data: CheckForUpdateRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/ota/CheckForUpdate`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags OTATasks
     * @name OtaStartOtaCreate
     * @request POST:/api/ota/StartOTA
     * @secure
     */
    otaStartOtaCreate: (data: StartOTARequest, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/api/ota/StartOTA`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name ProductGetProductDpInfoByUuidCreate
     * @request POST:/api/Product/GetProductDPInfoByUUID
     * @secure
     */
    productGetProductDpInfoByUuidCreate: (
      query?: {
        UUID?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Product/GetProductDPInfoByUUID`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name ProductGetProductDpInfoByProductIdCreate
     * @request POST:/api/Product/GetProductDPInfoByProductId
     * @secure
     */
    productGetProductDpInfoByProductIdCreate: (
      query?: {
        productId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Product/GetProductDPInfoByProductId`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name ProductGetProductInfoByProductIdCreate
     * @request POST:/api/Product/GetProductInfoByProductId
     * @secure
     */
    productGetProductInfoByProductIdCreate: (
      query?: {
        productId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Product/GetProductInfoByProductId`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name ProductGetProductsTotalCountCreate
     * @request POST:/api/Product/GetProductsTotalCount
     * @secure
     */
    productGetProductsTotalCountCreate: (
      data: ProductQueryRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Product/GetProductsTotalCount`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name ProductGetProductsCreate
     * @request POST:/api/Product/GetProducts
     * @secure
     */
    productGetProductsCreate: (
      data: ProductQueryRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Product/GetProducts`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name ProductSaveProductConfigCreate
     * @request POST:/api/Product/SaveProductConfig
     * @secure
     */
    productSaveProductConfigCreate: (
      data: SaveProductConfigRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Product/SaveProductConfig`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name ProductDeleteProductCreate
     * @request POST:/api/Product/DeleteProduct
     * @secure
     */
    productDeleteProductCreate: (
      query?: {
        productId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Product/DeleteProduct`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name ProductUploadProductImageCreate
     * @request POST:/api/Product/UploadProductImage
     * @secure
     */
    productUploadProductImageCreate: (
      data: {
        /** @format binary */
        file?: File;
      },
      query?: {
        productId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Product/UploadProductImage`,
        method: "POST",
        query: query,
        body: data,
        secure: true,
        type: ContentType.FormData,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Product
     * @name ProductCreateProductCreate
     * @request POST:/api/Product/CreateProduct
     * @secure
     */
    productCreateProductCreate: (
      data: CreateProductRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Product/CreateProduct`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ProductFirmwares
     * @name ProductFirmwaresAddProductFirmwareCreate
     * @request POST:/api/ProductFirmwares/AddProductFirmware
     * @secure
     */
    productFirmwaresAddProductFirmwareCreate: (
      data: AddProductFirmwareRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/ProductFirmwares/AddProductFirmware`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ProductFirmwares
     * @name ProductFirmwaresUpdateProductFirmwareCreate
     * @request POST:/api/ProductFirmwares/UpdateProductFirmware
     * @secure
     */
    productFirmwaresUpdateProductFirmwareCreate: (
      data: UpdateProductFirmwareRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/ProductFirmwares/UpdateProductFirmware`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ProductFirmwares
     * @name ProductFirmwaresDeleteProductFirmwareCreate
     * @request POST:/api/ProductFirmwares/DeleteProductFirmware
     * @secure
     */
    productFirmwaresDeleteProductFirmwareCreate: (
      query?: {
        productId?: string;
        firmwaresRepoId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/ProductFirmwares/DeleteProductFirmware`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ProductFirmwares
     * @name ProductFirmwaresQueryProductFirmwaresCreate
     * @request POST:/api/ProductFirmwares/QueryProductFirmwares
     * @secure
     */
    productFirmwaresQueryProductFirmwaresCreate: (
      data: QueryProductFirmwaresRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/ProductFirmwares/QueryProductFirmwares`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags ProductFirmwares
     * @name ProductFirmwaresFindProductFirmwareCreate
     * @request POST:/api/ProductFirmwares/FindProductFirmware
     * @secure
     */
    productFirmwaresFindProductFirmwareCreate: (
      query?: {
        productId?: string;
        firmwaresRepoId?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/ProductFirmwares/FindProductFirmware`,
        method: "POST",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersGetUsersTotalCountCreate
     * @request POST:/api/Users/GetUsersTotalCount
     * @secure
     */
    usersGetUsersTotalCountCreate: (
      data: UsersCountRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Users/GetUsersTotalCount`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersGetUsersCreate
     * @request POST:/api/Users/GetUsers
     * @secure
     */
    usersGetUsersCreate: (
      data: UsersQueryRequest,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/api/Users/GetUsers`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
}
