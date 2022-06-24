import React, { useState, useContext } from "react";
import { Drawer, Space } from "antd";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Socket } from "socket.io-client";

import { SocketContext } from "../../socket";
import { Data, Spider } from "../../interfaces/spider";
import { ScrapingContext, ISpiderProvider } from '../../ConfigurationContext'

import { DataSelectorConfig } from "./DataSelectorConfig";
import { DataAlterators } from '../Alterators/DataAlterators'

import './Data.scoped.css';


/**
 * Builds a UI to configure a Selector for the given scraping element
 * 
 */
export const DataConfig = ({
  data, spider
}: {
  data: Data,
  spider: Spider
}): JSX.Element => {
  const { t } = useTranslation("configurator");

  const spiderProvider = useContext<ISpiderProvider>(ScrapingContext);

  const socket = useContext<Socket>(SocketContext);

  // const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const [isConfigured, setIsConfigured] = useState<boolean>(false);


  // const toggleDrawer = (): void => {
  //   setIsDrawerOpen(!isDrawerOpen);
  // };

  const onConfigured = (data: Data): void => {
    setIsConfigured(true);
    spider.data?.add(data);
    spiderProvider.upsert(socket, spider, (b: boolean) => {
      console.log('upsert successful');
    });
  };

  const onError = (): void => {
    setIsConfigured(false);
  };

  /**
   * the page URL is passed to the selector
   * so that it can be evaluated
   */
  // useEffect(() => {
  //   toggleDrawer();
  // }, [data]);

  return (
    // <Drawer
    //   title={t("field.title")}
    //   size="large"
    //   placement="right"
    //   closable={false}
    //   onClose={toggleDrawer}
    //   visible={isDrawerOpen}
    // >
    <>
      <h2>{data.label}</h2>
      <Space direction="vertical" size="large" style={{ 'width': '100%' }}>

        {
          //spider.sampleURLs && spider.sampleURLs.length > 0 &&
          <DataSelectorConfig data={data} sampleUrl={new URL('https://www.manomano.fr/p/lot-de-2-mats-de-fixation-pour-voile-dombrage-h220-cm-poteaux-et-bases-acier-30197103')} onConfigured={onConfigured} onError={onError} />
        }

        {isConfigured &&
          <Space direction="vertical" size="middle" style={{ 'width': '100%' }}>
            <h2>{t('field.alterators_title')}</h2>
            <DataAlterators />
          </Space>
        }
      </Space>
    </>

  );
};


