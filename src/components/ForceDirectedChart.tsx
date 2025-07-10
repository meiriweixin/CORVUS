import React, { useEffect, useRef } from 'react';
import * as am5 from '@amcharts/amcharts5';
import * as am5hierarchy from '@amcharts/amcharts5/hierarchy';
import am5themes_Animated from '@amcharts/amcharts5/themes/Animated';

interface ForceDirectedData {
  name: string;
  value?: number;
  children?: ForceDirectedData[];
  nodeType?: 'article' | 'actor' | 'victim' | 'event' | 'theme';
  articleId?: number;
  date?: string;
  source?: string;
}

interface ForceDirectedChartProps {
  data: ForceDirectedData;
  width?: string;
  height?: string;
}

export const ForceDirectedChart: React.FC<ForceDirectedChartProps> = ({ 
  data, 
  width = '100%', 
  height = '600px' 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<am5.Root | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose previous chart
    if (rootRef.current) {
      rootRef.current.dispose();
    }

    // Create root element
    const root = am5.Root.new(chartRef.current);
    rootRef.current = root;

    // Set themes
    root.setThemes([
      am5themes_Animated.new(root)
    ]);

    // Create wrapper container
    const container = root.container.children.push(am5.Container.new(root, {
      width: am5.percent(100),
      height: am5.percent(100),
      layout: root.verticalLayout
    }));

    // Create series
    const series = container.children.push(am5hierarchy.ForceDirected.new(root, {
      singleBranchOnly: false,
      downDepth: 4,
      topDepth: 3,
      initialDepth: 3,
      valueField: "value",
      categoryField: "name",
      childDataField: "children",
      idField: "name",
      linkWithField: "linkWith",
      manyBodyStrength: -25,
      centerStrength: 0.5,
      minRadius: 25,
      maxRadius: 100,
      velocityDecay: 0.9,
      nodePadding: 5
    }));

    // Configure node styling based on nodeType
    series.nodes.template.setup = function(target) {
      const dataItem = target.dataItem;
      if (dataItem) {
        const nodeType = dataItem.get("nodeType");
        const circle = target.get("circle");
        
        if (circle) {
          switch (nodeType) {
            case 'article':
              circle.set("fill", am5.color("#3B82F6")); // Blue
              circle.set("stroke", am5.color("#1E40AF")); // Darker blue border
              break;
            case 'actor':
              circle.set("fill", am5.color("#EF4444")); // Red
              circle.set("stroke", am5.color("#B91C1C")); // Darker red border
              break;
            case 'victim':
              circle.set("fill", am5.color("#F59E0B")); // Orange
              circle.set("stroke", am5.color("#D97706")); // Darker orange border
              break;
            case 'event':
              circle.set("fill", am5.color("#10B981")); // Green
              circle.set("stroke", am5.color("#047857")); // Darker green border
              break;
            case 'theme':
              circle.set("fill", am5.color("#8B5CF6")); // Purple
              circle.set("stroke", am5.color("#7C3AED")); // Darker purple border
              break;
            default:
              circle.set("fill", am5.color("#6B7280")); // Gray
              circle.set("stroke", am5.color("#4B5563")); // Darker gray border
          }
          
          // Enhanced styling
          circle.set("strokeWidth", 3);
          circle.set("strokeOpacity", 0.8);
          circle.set("fillOpacity", 0.9);
          
          // Add gradient effect for root nodes
          if (dataItem.get("depth") === 0) {
            circle.set("strokeWidth", 4);
            circle.set("stroke", am5.color("#FFFFFF"));
          }
        }
      }
    };

    // Configure labels
    series.nodes.template.get("label")?.setAll({
      text: "{name}",
      textAlign: "center",
      centerY: 0,
      centerX: am5.percent(50),
      fontSize: "11px",
      fontWeight: "600",
      fill: am5.color("#FFFFFF"),
      maxWidth: 100,
      oversizedBehavior: "wrap",
      shadowColor: am5.color("#000000"),
      shadowOpacity: 0.8,
      shadowOffsetX: 1,
      shadowOffsetY: 1
    });

    // Configure links styling
    series.links.template.setAll({
      strength: 1.2,
      strokeWidth: 3,
      stroke: am5.color("#64748B"),
      strokeOpacity: 0.8,
      strokeDasharray: [4, 4]
    });

    // Different link styles based on depth
    series.links.template.setup = function(target) {
      const sourceDataItem = target.get("source");
      const targetDataItem = target.get("target");
      
      if (sourceDataItem && targetDataItem) {
        const sourceDepth = sourceDataItem.get("depth") || 0;
        const targetDepth = targetDataItem.get("depth") || 0;
        
        if (sourceDepth === 0 || targetDepth === 0) {
          // Links to/from root - thicker and more prominent
          target.setAll({
            strokeWidth: 4,
            stroke: am5.color("#94A3B8"),
            strokeOpacity: 0.9,
            strokeDasharray: [6, 3]
          });
        } else if (sourceDepth === 1 || targetDepth === 1) {
          // Links to/from first level - medium
          target.setAll({
            strokeWidth: 3,
            stroke: am5.color("#64748B"),
            strokeOpacity: 0.7,
            strokeDasharray: [4, 4]
          });
        } else {
          // Deeper links - thinner
          target.setAll({
            strokeWidth: 2,
            stroke: am5.color("#475569"),
            strokeOpacity: 0.5,
            strokeDasharray: [2, 6]
          });
        }
      }
    };

    // Add interactivity
    series.nodes.template.onPrivate("circle", function(circle) {
      if (circle) {
        circle.onPrivate("radius", function(radius) {
          if (radius && radius > 0) {
            circle.set("stroke", am5.color("#FFFFFF"));
            circle.set("strokeWidth", 2);
            circle.set("strokeOpacity", 0.8);
          }
        });

        // Hover states
        circle.states.create("hover", {
          strokeWidth: 3,
          strokeOpacity: 1,
          scale: 1.1
        });
      }
    });

    // Set data
    series.data.setAll([data]);

    // Set initial selection
    series.set("selectedDataItem", series.dataItems[0]);

    // Animation
    series.appear(1000, 100);

    // Cleanup function
    return () => {
      if (rootRef.current) {
        rootRef.current.dispose();
        rootRef.current = null;
      }
    };
  }, [data]);

  return (
    <div 
      ref={chartRef} 
      style={{ 
        width, 
        height,
        background: 'transparent' 
      }} 
    />
  );
};

// Helper function to transform analysis data to amcharts format
export const transformToAmChartsData = (analysisData: any): ForceDirectedData => {
  if (!analysisData || !analysisData.keyPoints) {
    return {
      name: "Intelligence Analysis",
      children: []
    };
  }

  const articles = analysisData.keyPoints || [];
  const relationships = analysisData.relationships || {};
  
  // Create the root structure
  const rootData: ForceDirectedData = {
    name: "Cyber Intelligence Study",
    nodeType: 'theme',
    children: []
  };

  // Add articles as main branches
  articles.forEach((article: any, index: number) => {
    const articleNode: ForceDirectedData = {
      name: article.title.length > 30 ? article.title.substring(0, 30) + "..." : article.title,
      nodeType: 'article',
      articleId: article.articleId,
      value: 10,
      children: []
    };

    // Add key points as children of articles
    if (article.keyPoints && article.keyPoints.length > 0) {
      article.keyPoints.forEach((point: string, pointIndex: number) => {
        if (pointIndex < 3) { // Limit to 3 key points for clarity
          articleNode.children!.push({
            name: point.length > 40 ? point.substring(0, 40) + "..." : point,
            nodeType: 'event',
            value: 5
          });
        }
      });
    }

    // Add timeline info if available
    if (article.timeline) {
      articleNode.children!.push({
        name: `Timeline: ${article.timeline}`,
        nodeType: 'event',
        value: 3
      });
    }

    rootData.children!.push(articleNode);
  });

  // Add common themes as a separate branch
  if (relationships.commonThemes && relationships.commonThemes.length > 0) {
    const themesNode: ForceDirectedData = {
      name: "Common Themes",
      nodeType: 'theme',
      value: 15,
      children: relationships.commonThemes.map((theme: string) => ({
        name: theme,
        nodeType: 'theme',
        value: 3
      }))
    };
    rootData.children!.push(themesNode);
  }

  // Extract threat actors and victims from the enhanced analysis
  const threatActors = new Set<string>();
  const victims = new Set<string>();
  const attackVectors = new Set<string>();

  articles.forEach((article: any) => {
    // Extract threat actors from the new threatActors field
    if (article.threatActors && Array.isArray(article.threatActors)) {
      article.threatActors.forEach((actor: string) => {
        if (actor && actor !== 'Unknown' && actor.trim() !== '') {
          threatActors.add(actor);
        }
      });
    }

    // Extract victims from the new victims field
    if (article.victims && Array.isArray(article.victims)) {
      article.victims.forEach((victim: string) => {
        if (victim && victim !== 'Unknown' && victim.trim() !== '') {
          victims.add(victim);
        }
      });
    }

    // Extract attack vectors
    if (article.attackVectors && Array.isArray(article.attackVectors)) {
      article.attackVectors.forEach((vector: string) => {
        if (vector && vector.trim() !== '') {
          attackVectors.add(vector);
        }
      });
    }
  });

  // Add threat actors branch if any found
  if (threatActors.size > 0) {
    const actorsNode: ForceDirectedData = {
      name: "Threat Actors",
      nodeType: 'actor',
      value: 15,
      children: Array.from(threatActors).map(actor => ({
        name: actor,
        nodeType: 'actor',
        value: 8
      }))
    };
    rootData.children!.push(actorsNode);
  }

  // Add victims branch if any found
  if (victims.size > 0) {
    const victimsNode: ForceDirectedData = {
      name: "Targets & Victims",
      nodeType: 'victim',
      value: 15,
      children: Array.from(victims).map(victim => ({
        name: victim,
        nodeType: 'victim',
        value: 7
      }))
    };
    rootData.children!.push(victimsNode);
  }

  // Add attack vectors branch if any found
  if (attackVectors.size > 0) {
    const vectorsNode: ForceDirectedData = {
      name: "Attack Methods",
      nodeType: 'event',
      value: 12,
      children: Array.from(attackVectors).map(vector => ({
        name: vector.length > 30 ? vector.substring(0, 30) + "..." : vector,
        nodeType: 'event',
        value: 5
      }))
    };
    rootData.children!.push(vectorsNode);
  }

  // Add connections/relationships branch
  if (relationships.connectionPoints && relationships.connectionPoints.length > 0) {
    const connectionsNode: ForceDirectedData = {
      name: "Relationships",
      nodeType: 'event',
      value: 10,
      children: relationships.connectionPoints.map((connection: string) => ({
        name: connection.length > 35 ? connection.substring(0, 35) + "..." : connection,
        nodeType: 'event',
        value: 4
      }))
    };
    rootData.children!.push(connectionsNode);
  }

  return rootData;
}; 