import React from "react";
import { Layout, Menu } from "antd";
import { useTranslation } from "react-i18next";

import "../../i18n";


const { Header, Sider, Content } = Layout;


export const OnBoardingLayout = ({ children }: { children: React.ReactNode }) => {
    const { t } = useTranslation("layout");

    return (
        <Layout>
            <Header className="gus-layout-helper">
                <h2>{t("helper.onboarding.title")}</h2>
                <p>{t("helper.onboarding.content")}</p>
            </Header>
            <Layout>
                <Content className="gus-onboarding-layout-content">{children}</Content>
            </Layout>
        </Layout>
    );
};

export const ScraperLayout = ({ header, children }: { header: React.ReactNode, children: React.ReactNode }) => {
    const { t } = useTranslation("layout");

    return (
        <Layout>
            <Header className="gus-layout-helper">
                <h2>{t("helper.title")}</h2>
                <p>{t("helper.content")}</p>
            </Header>
            <Layout>
                <Content className="gus-scraper-layout-content">
                    <Header className="gus-scraper-layout-content-header">
                        {header}
                    </Header>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};