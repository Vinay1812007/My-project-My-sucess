<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9">
<xsl:output method="html" indent="yes"/>
<xsl:template match="/">
  <html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Neon Beats - XML Sitemap</title>
    <link rel="stylesheet" href="style.css"/>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"/>
  </head>
  <body>
    <div class="neon-blink-bg active"></div>
    <div class="cursor-dot" id="cursorDot"></div>
    <div class="cursor-outline" id="cursorOutline"></div>

    <nav class="glass-panel sticky-nav">
        <div class="nav-container">
            <div class="logo pulse-logo">NEON<span class="highlight">BEATS</span></div>
            <div class="nav-right">
                <a href="/" class="tab-btn magnetic">Back to Home</a>
            </div>
        </div>
    </nav>

    <div class="landing-container fade-in-up" style="height: auto; min-height: 80vh; padding-top: 100px; justify-content: flex-start;">
        <div class="glass-panel" style="padding: 40px; max-width: 800px; width: 100%; text-align: left;">
            <h2 style="margin-bottom: 10px; border-bottom: 1px solid var(--glass-border); padding-bottom: 10px;">
                <i class="fa-solid fa-code" style="color: var(--neon-main);"></i> XML Sitemap
            </h2>
            <p style="color: #aaa; margin-bottom: 20px;">This file is optimized for search engines (Google), but we styled it for you.</p>
            
            <div class="history-section" style="border: none;">
                <xsl:for-each select="sitemap:urlset/sitemap:url">
                    <div class="history-item magnetic">
                        <div class="history-icon"><i class="fa-solid fa-link"></i></div>
                        <div class="history-info">
                            <a href="{sitemap:loc}" class="history-link" style="font-size: 1.1rem;"><xsl:value-of select="sitemap:loc"/></a>
                            <div class="history-date">Priority: <xsl:value-of select="sitemap:priority"/></div>
                        </div>
                    </div>
                </xsl:for-each>
            </div>
        </div>
    </div>
    <script src="script.js"></script>
  </body>
  </html>
</xsl:template>
</xsl:stylesheet>
