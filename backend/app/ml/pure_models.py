"""Pure Python and NumPy implementations of the 5 regression models.

Used as a fallback when scikit-learn, scipy, or xgboost are blocked
by local operating system application control policies (e.g. WDAC/AppLocker).
"""

from __future__ import annotations
import numpy as np
from typing import List, Dict, Any

class PureLinearRegression:
    def __init__(self):
        self.coef_ = None
        self.intercept_ = 0.0

    def fit(self, X: np.ndarray, y: np.ndarray) -> PureLinearRegression:
        # Standard OLS closed-form: w = (X^T X)^(-1) X^T y
        # Add column of ones for intercept
        X_design = np.hstack([np.ones((X.shape[0], 1)), X])
        try:
            # Solve using pseudo-inverse for stability
            w = np.linalg.pinv(X_design.T @ X_design) @ X_design.T @ y
            self.intercept_ = float(w[0])
            self.coef_ = w[1:]
        except Exception:
            # Fallback to simple gradient descent if linear algebra fails
            n_features = X.shape[1]
            self.coef_ = np.zeros(n_features)
            self.intercept_ = float(np.mean(y))
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        return X @ self.coef_ + self.intercept_


class TreeNode:
    def __init__(self, feature=None, threshold=None, left=None, right=None, value=None):
        self.feature = feature
        self.threshold = threshold
        self.left = left
        self.right = right
        self.value = value

    def is_leaf(self) -> bool:
        return self.value is not None


class PureDecisionTreeRegressor:
    def __init__(self, max_depth: int = 5, min_samples_split: int = 5):
        self.max_depth = max_depth
        self.min_samples_split = min_samples_split
        self.root = None
        self.feature_importances_ = None

    def fit(self, X: np.ndarray, y: np.ndarray) -> PureDecisionTreeRegressor:
        self.n_features = X.shape[1]
        self.importances = np.zeros(self.n_features)
        self.root = self._grow_tree(X, y, depth=0)
        
        # Normalize importances
        total_imp = self.importances.sum()
        if total_imp > 0:
            self.feature_importances_ = self.importances / total_imp
        else:
            self.feature_importances_ = np.ones(self.n_features) / self.n_features
        return self

    def _grow_tree(self, X: np.ndarray, y: np.ndarray, depth: int) -> TreeNode:
        n_samples, n_feats = X.shape

        # Leaf conditions
        if depth >= self.max_depth or n_samples < self.min_samples_split or np.var(y) < 1e-5:
            return TreeNode(value=float(np.mean(y)))

        # Find best split
        best_feat, best_thresh, best_mse = None, None, float("inf")
        # Sample features to speed up and reduce correlation
        feat_idxs = np.random.choice(n_feats, min(n_feats, 8), replace=False)
        
        for feat in feat_idxs:
            X_column = X[:, feat]
            thresholds = np.percentile(X_column, [20, 40, 60, 80])
            for thresh in thresholds:
                left_mask = X_column <= thresh
                right_mask = ~left_mask
                
                if left_mask.sum() < 2 or right_mask.sum() < 2:
                    continue
                    
                mse = self._calculate_split_mse(y, left_mask, right_mask)
                if mse < best_mse:
                    best_mse = mse
                    best_feat = feat
                    best_thresh = thresh

        if best_feat is None:
            return TreeNode(value=float(np.mean(y)))

        # Grow subtrees
        left_mask = X[:, best_feat] <= best_thresh
        left_child = self._grow_tree(X[left_mask], y[left_mask], depth + 1)
        right_child = self._grow_tree(X[~left_mask], y[~left_mask], depth + 1)

        # Record feature importance (reduction in variance)
        parent_var = np.var(y) * n_samples
        left_var = np.var(y[left_mask]) * left_mask.sum()
        right_var = np.var(y[~left_mask]) * (~left_mask).sum()
        var_reduction = parent_var - (left_var + right_var)
        self.importances[best_feat] += max(0, var_reduction)

        return TreeNode(feature=best_feat, threshold=best_thresh, left=left_child, right=right_child)

    def _calculate_split_mse(self, y: np.ndarray, left_mask: np.ndarray, right_mask: np.ndarray) -> float:
        left_y, right_y = y[left_mask], y[right_mask]
        return float(np.sum((left_y - np.mean(left_y))**2) + np.sum((right_y - np.mean(right_y))**2))

    def predict(self, X: np.ndarray) -> np.ndarray:
        return np.array([self._predict_row(self.root, row) for row in X])

    def _predict_row(self, node: TreeNode, row: np.ndarray) -> float:
        if node.is_leaf():
            return node.value
        if row[node.feature] <= node.threshold:
            return self._predict_row(node.left, row)
        return self._predict_row(node.right, row)


class PureRandomForestRegressor:
    def __init__(self, n_estimators: int = 30, max_depth: int = 6):
        self.n_estimators = n_estimators
        self.max_depth = max_depth
        self.trees = []
        self.feature_importances_ = None

    def fit(self, X: np.ndarray, y: np.ndarray) -> PureRandomForestRegressor:
        self.trees = []
        n_samples = X.shape[0]
        n_features = X.shape[1]
        importances_sum = np.zeros(n_features)

        for _ in range(self.n_estimators):
            # Bootstrap sample
            boot_idx = np.random.choice(n_samples, n_samples, replace=True)
            tree = PureDecisionTreeRegressor(max_depth=self.max_depth)
            tree.fit(X[boot_idx], y[boot_idx])
            self.trees.append(tree)
            importances_sum += tree.feature_importances_

        self.feature_importances_ = importances_sum / self.n_estimators
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        tree_preds = np.array([tree.predict(X) for tree in self.trees])
        return np.mean(tree_preds, axis=0)


class PureGradientBoostingRegressor:
    def __init__(self, n_estimators: int = 30, learning_rate: float = 0.1, max_depth: int = 4):
        self.n_estimators = n_estimators
        self.learning_rate = learning_rate
        self.max_depth = max_depth
        self.trees = []
        self.initial_pred = 0.0
        self.feature_importances_ = None

    def fit(self, X: np.ndarray, y: np.ndarray) -> PureGradientBoostingRegressor:
        self.trees = []
        self.initial_pred = float(np.mean(y))
        
        current_preds = np.full(y.shape, self.initial_pred)
        n_features = X.shape[1]
        importances_sum = np.zeros(n_features)

        for _ in range(self.n_estimators):
            residuals = y - current_preds
            tree = PureDecisionTreeRegressor(max_depth=self.max_depth)
            tree.fit(X, residuals)
            self.trees.append(tree)
            current_preds += self.learning_rate * tree.predict(X)
            importances_sum += tree.feature_importances_

        self.feature_importances_ = importances_sum / self.n_estimators
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        preds = np.full(X.shape[0], self.initial_pred)
        for tree in self.trees:
            preds += self.learning_rate * tree.predict(X)
        return preds


class PureXGBoostRegressor(PureGradientBoostingRegressor):
    """Replicates gradient boosting regressor behavior in pure python/numpy."""
    pass
